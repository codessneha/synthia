import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  TuneRounded,
} from '@mui/icons-material';

const SEARCH_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'arxiv', label: 'arXiv' },
  { value: 'pubmed', label: 'PubMed' },
  { value: 'semantic_scholar', label: 'Semantic Scholar' },
];

const CATEGORIES = [
  'Computer Science',
  'Physics',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Engineering',
  'Medicine',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date' },
  { value: 'citations', label: 'Citations' },
];

export default function SearchBar({ 
  onSearch, 
  loading = false,
  defaultSource = 'all',
  showFilters = true,
  placeholder = 'Search papers by title, author, or keywords...'
}) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState(defaultSource);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced filters
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minCitations, setMinCitations] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;

    const filters = {
      query: query.trim(),
      source,
      ...(category && { category }),
      ...(sortBy !== 'relevance' && { sortBy }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(minCitations && { minCitations: parseInt(minCitations) }),
    };

    onSearch(filters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setCategory('');
    setSortBy('relevance');
    setDateFrom('');
    setDateTo('');
    setMinCitations('');
  };

  const hasActiveFilters = category || dateFrom || dateTo || minCitations || sortBy !== 'relevance';

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      {/* Main search row */}
      <Box sx={{ display: 'flex', gap: 2, mb: showAdvanced ? 2 : 0 }}>
        {/* Search input */}
        <TextField
          fullWidth
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={handleClear}
                  disabled={loading}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Source selector */}
        <TextField
          select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={loading}
          sx={{ minWidth: 150 }}
        >
          {SEARCH_SOURCES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Search button */}
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>

        {/* Filter toggle */}
        {showFilters && (
          <IconButton 
            onClick={() => setShowAdvanced(!showAdvanced)}
            color={hasActiveFilters ? 'primary' : 'default'}
          >
            <TuneRounded />
          </IconButton>
        )}
      </Box>

      {/* Advanced filters */}
      {showAdvanced && showFilters && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {/* Row 1 */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Autocomplete
              options={CATEGORIES}
              value={category}
              onChange={(e, newValue) => setCategory(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Category" placeholder="Any" />
              )}
              sx={{ minWidth: 200, flexGrow: 1 }}
              size="small"
            />

            <TextField
              select
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Min Citations"
              type="number"
              value={minCitations}
              onChange={(e) => setMinCitations(e.target.value)}
              placeholder="Any"
              sx={{ width: 130 }}
              size="small"
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
          </Box>

          {/* Row 2 - Date range */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
              size="small"
            />
            <TextField
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
              size="small"
            />
            {hasActiveFilters && (
              <Button 
                size="small" 
                onClick={handleClear}
                startIcon={<Clear />}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Active filters display */}
          {hasActiveFilters && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {category && (
                <Chip
                  label={`Category: ${category}`}
                  size="small"
                  onDelete={() => setCategory('')}
                />
              )}
              {sortBy !== 'relevance' && (
                <Chip
                  label={`Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}
                  size="small"
                  onDelete={() => setSortBy('relevance')}
                />
              )}
              {dateFrom && (
                <Chip
                  label={`From: ${dateFrom}`}
                  size="small"
                  onDelete={() => setDateFrom('')}
                />
              )}
              {dateTo && (
                <Chip
                  label={`To: ${dateTo}`}
                  size="small"
                  onDelete={() => setDateTo('')}
                />
              )}
              {minCitations && (
                <Chip
                  label={`Min Citations: ${minCitations}`}
                  size="small"
                  onDelete={() => setMinCitations('')}
                />
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Search suggestions (optional) */}
      {query && query.length < 3 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Type at least 3 characters to search
          </Typography>
        </Box>
      )}
    </Paper>
  );
}