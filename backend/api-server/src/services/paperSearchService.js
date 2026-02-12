import axios from 'axios';
import xml2js from 'xml2js';
import logger from '../utils/logger.js';

/**
 * Paper Search Service
 * Integrates with external academic paper APIs
 */
class PaperSearchService {
  constructor() {
    this.arxivBaseUrl = process.env.ARXIV_API_URL || 'http://export.arxiv.org/api/query';
    this.pubmedBaseUrl = process.env.PUBMED_API_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    this.semanticScholarBaseUrl = process.env.SEMANTIC_SCHOLAR_API_URL || 'https://api.semanticscholar.org/graph/v1';
    this.crossrefBaseUrl = process.env.CROSSREF_API_URL || 'https://api.crossref.org';
  }

  /**
   * Search arXiv for papers
   */
  async searchArxiv(query, options = {}) {
    try {
      const {
        maxResults = 10,
        sortBy = 'relevance', // 'relevance', 'lastUpdatedDate', 'submittedDate'
        sortOrder = 'descending',
        start = 0
      } = options;

      const params = {
        search_query: `all:${query}`,
        start,
        max_results: maxResults,
        sortBy,
        sortOrder
      };

      logger.info(`Searching arXiv: ${query}`);

      const response = await axios.get(this.arxivBaseUrl, {
        params,
        timeout: 10000
      });

      // Parse XML response
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);

      // Extract entries
      const entries = result.feed.entry;
      if (!entries) {
        return [];
      }

      // Normalize to array
      const papers = Array.isArray(entries) ? entries : [entries];

      // Format papers
      return papers.map(entry => this._formatArxivPaper(entry));

    } catch (error) {
      logger.error('arXiv search error:', error.message);
      throw new Error(`arXiv search failed: ${error.message}`);
    }
  }

  /**
   * Get paper by arXiv ID
   */
  async getArxivPaper(arxivId) {
    try {
      logger.info(`Fetching arXiv paper: ${arxivId}`);

      const response = await axios.get(this.arxivBaseUrl, {
        params: { id_list: arxivId },
        timeout: 10000
      });

      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);

      const entry = result.feed.entry;
      if (!entry) {
        return null;
      }

      return this._formatArxivPaper(entry);

    } catch (error) {
      logger.error('arXiv fetch error:', error.message);
      throw new Error(`arXiv fetch failed: ${error.message}`);
    }
  }

  /**
   * Search PubMed for papers
   */
  async searchPubMed(query, options = {}) {
    try {
      const { maxResults = 10, start = 0 } = options;

      logger.info(`Searching PubMed: ${query}`);

      // Step 1: Search for IDs
      const searchUrl = `${this.pubmedBaseUrl}/esearch.fcgi`;
      const searchParams = {
        db: 'pubmed',
        term: query,
        retmax: maxResults,
        retstart: start,
        retmode: 'json'
      };

      if (process.env.PUBMED_API_KEY) {
        searchParams.api_key = process.env.PUBMED_API_KEY;
      }

      const searchResponse = await axios.get(searchUrl, {
        params: searchParams,
        timeout: 10000
      });

      const idList = searchResponse.data.esearchresult.idlist;
      if (!idList || idList.length === 0) {
        return [];
      }

      // Step 2: Fetch details for IDs
      const fetchUrl = `${this.pubmedBaseUrl}/esummary.fcgi`;
      const fetchParams = {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'json'
      };

      if (process.env.PUBMED_API_KEY) {
        fetchParams.api_key = process.env.PUBMED_API_KEY;
      }

      const fetchResponse = await axios.get(fetchUrl, {
        params: fetchParams,
        timeout: 10000
      });

      const results = fetchResponse.data.result;

      // Format papers
      return idList.map(id => this._formatPubMedPaper(results[id]));

    } catch (error) {
      logger.error('PubMed search error:', error.message);
      throw new Error(`PubMed search failed: ${error.message}`);
    }
  }

  /**
   * Search Semantic Scholar
   */
  async searchSemanticScholar(query, options = {}) {
    try {
      const { limit = 10, offset = 0, fields = 'title,authors,abstract,year,citationCount,url' } = options;

      logger.info(`Searching Semantic Scholar: ${query}`);

      const headers = {};
      if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
        headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
      }

      const response = await axios.get(`${this.semanticScholarBaseUrl}/paper/search`, {
        params: {
          query,
          limit,
          offset,
          fields
        },
        headers,
        timeout: 10000
      });

      return response.data.data.map(paper => this._formatSemanticScholarPaper(paper));

    } catch (error) {
      logger.error('Semantic Scholar search error:', error.message);
      throw new Error(`Semantic Scholar search failed: ${error.message}`);
    }
  }

  /**
   * Get paper by DOI from CrossRef
   */
  async getPaperByDOI(doi) {
    try {
      logger.info(`Fetching paper by DOI: ${doi}`);

      const response = await axios.get(`${this.crossrefBaseUrl}/works/${doi}`, {
        timeout: 10000
      });

      return this._formatCrossRefPaper(response.data.message);

    } catch (error) {
      logger.error('CrossRef fetch error:', error.message);
      throw new Error(`CrossRef fetch failed: ${error.message}`);
    }
  }

  /**
   * Multi-source search
   */
  async searchAll(query, options = {}) {
    const { sources = ['arxiv', 'pubmed', 'semantic_scholar'], maxResults = 10 } = options;

    const results = {
      arxiv: [],
      pubmed: [],
      semantic_scholar: [],
      total: 0
    };

    const promises = [];

    if (sources.includes('arxiv')) {
      promises.push(
        this.searchArxiv(query, { maxResults })
          .then(papers => { results.arxiv = papers; })
          .catch(err => logger.error('arXiv search failed:', err.message))
      );
    }

    if (sources.includes('pubmed')) {
      promises.push(
        this.searchPubMed(query, { maxResults })
          .then(papers => { results.pubmed = papers; })
          .catch(err => logger.error('PubMed search failed:', err.message))
      );
    }

    if (sources.includes('semantic_scholar')) {
      promises.push(
        this.searchSemanticScholar(query, { limit: maxResults })
          .then(papers => { results.semantic_scholar = papers; })
          .catch(err => logger.error('Semantic Scholar search failed:', err.message))
      );
    }

    await Promise.all(promises);

    results.total = results.arxiv.length + results.pubmed.length + results.semantic_scholar.length;

    return results;
  }

  // Formatting helpers

  _formatArxivPaper(entry) {
    const authors = Array.isArray(entry.author)
      ? entry.author.map(a => ({ name: a.name }))
      : [{ name: entry.author?.name || 'Unknown' }];

    // Extract arXiv ID from ID URL
    const arxivId = entry.id.split('/abs/').pop();

    return {
      title: entry.title.replace(/\s+/g, ' ').trim(),
      authors,
      abstract: entry.summary.replace(/\s+/g, ' ').trim(),
      publicationDate: new Date(entry.published),
      source: 'arXiv',
      sourceUrl: entry.id,
      arxivId,
      pdfUrl: entry.id.replace('/abs/', '/pdf/') + '.pdf',
      category: entry.category?.$?.term || entry['arxiv:primary_category']?.$?.term || 'Unknown',
      doi: entry['arxiv:doi']?._,
      keywords: []
    };
  }

  _formatPubMedPaper(entry) {
    if (!entry) return null;

    const authors = entry.authors?.map(a => ({
      name: a.name
    })) || [];

    return {
      title: entry.title,
      authors,
      abstract: entry.abstract || 'No abstract available',
      publicationDate: new Date(entry.pubdate),
      source: 'PubMed',
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${entry.uid}/`,
      pubmedId: entry.uid,
      journal: {
        name: entry.fulljournalname,
        volume: entry.volume,
        issue: entry.issue,
        pages: entry.pages
      },
      doi: entry.elocationid?.replace('doi: ', ''),
      keywords: []
    };
  }

  _formatSemanticScholarPaper(paper) {
    const authors = paper.authors?.map(a => ({
      name: a.name
    })) || [];

    return {
      title: paper.title,
      authors,
      abstract: paper.abstract || 'No abstract available',
      publicationDate: paper.year ? new Date(paper.year, 0, 1) : null,
      source: 'Semantic Scholar',
      sourceUrl: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      citationCount: paper.citationCount || 0,
      keywords: []
    };
  }

  _formatCrossRefPaper(paper) {
    const authors = paper.author?.map(a => ({
      name: `${a.given || ''} ${a.family || ''}`.trim()
    })) || [];

    return {
      title: paper.title?.[0] || 'Untitled',
      authors,
      abstract: paper.abstract || 'No abstract available',
      publicationDate: paper.created?.['date-time'] ? new Date(paper.created['date-time']) : null,
      source: 'CrossRef',
      sourceUrl: paper.URL,
      doi: paper.DOI,
      journal: {
        name: paper['container-title']?.[0],
        volume: paper.volume,
        issue: paper.issue,
        pages: paper.page,
        publisher: paper.publisher
      },
      keywords: []
    };
  }
}

export default new PaperSearchService();
