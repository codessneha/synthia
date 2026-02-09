import Session from '../models/Session.js';
import Paper from '../models/Paper.js';
import logger from '../utils/logger.js';
import axios from 'axios';

/**
 * @desc    Send message to AI and get response
 * @route   POST /api/v1/chat/:sessionId/message
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    // Get session
    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    }).populate('papers.paper');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Add user message to session
    await session.addMessage('user', content);

    // Prepare context for AI
    const context = {
      sessionId: session._id,
      papers: session.papers.map(p => ({
        id: p.paper._id,
        title: p.paper.title,
        authors: p.paper.authors.map(a => a.name).join(', '),
        abstract: p.paper.abstract,
        keywords: p.paper.keywords
      })),
      conversationHistory: session.messages.slice(-10), // Last 10 messages
      userIntent: session.context.userIntent,
      settings: session.settings
    };

    // Call AI service
    let aiResponse;
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await axios.post(
        `${aiServiceUrl}/api/v1/chat/completion`,
        {
          message: content,
          context,
          model: session.settings.aiModel || 'gpt-4',
          temperature: session.settings.temperature || 0.7,
          maxTokens: session.settings.maxTokens || 2000
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // 60 seconds timeout
        }
      );

      aiResponse = response.data;

    } catch (aiError) {
      logger.error('AI service error:', aiError);
      
      // Fallback response if AI service is unavailable
      aiResponse = {
        content: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        metadata: {
          model: 'fallback',
          tokens: 0,
          error: true
        }
      };
    }

    // Add AI response to session
    await session.addMessage('assistant', aiResponse.content, aiResponse.metadata);

    // Update session context
    if (!session.context.keyTopics) {
      session.context.keyTopics = [];
    }
    session.context.summary = `User discussing: ${content}`;
    await session.save();

    logger.info(`Message sent in session: ${session.name}`);

    res.status(200).json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date(),
          metadata: aiResponse.metadata
        },
        session: {
          id: session._id,
          messageCount: session.messages.length
        }
      }
    });

  } catch (error) {
    logger.error('Send message error:', error);
    next(error);
  }
};

/**
 * @desc    Get chat messages for a session
 * @route   GET /api/v1/chat/:sessionId/messages
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    }).select('messages');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get paginated messages
    const messages = session.messages
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        messages,
        total: session.messages.length,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + parseInt(limit)) < session.messages.length
        }
      }
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    next(error);
  }
};

/**
 * @desc    Clear chat history
 * @route   DELETE /api/v1/chat/:sessionId/messages
 * @access  Private
 */
const clearMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Keep system messages, clear user/assistant messages
    session.messages = session.messages.filter(m => m.role === 'system');
    session.stats.messageCount = session.messages.length;
    await session.save();

    logger.info(`Chat history cleared for session: ${session.name}`);

    res.status(200).json({
      success: true,
      message: 'Chat history cleared'
    });

  } catch (error) {
    logger.error('Clear messages error:', error);
    next(error);
  }
};

/**
 * @desc    Analyze papers (comparative analysis)
 * @route   POST /api/v1/chat/:sessionId/analyze
 * @access  Private
 */
const analyzePapers = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { analysisType = 'compare', focusAreas } = req.body;

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    }).populate('papers.paper');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.papers.length < 2 && analysisType === 'compare') {
      return res.status(400).json({
        success: false,
        message: 'At least 2 papers required for comparative analysis'
      });
    }

    // Prepare analysis request
    const analysisData = {
      analysisType,
      papers: session.papers.map(p => ({
        id: p.paper._id,
        title: p.paper.title,
        authors: p.paper.authors.map(a => a.name),
        abstract: p.paper.abstract,
        keywords: p.paper.keywords,
        methodology: p.paper.aiSummary?.methodology,
        keyFindings: p.paper.aiSummary?.keyFindings
      })),
      focusAreas: focusAreas || ['methodology', 'findings', 'limitations']
    };

    // Call AI service for analysis
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await axios.post(
        `${aiServiceUrl}/api/v1/analysis/compare`,
        analysisData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000 // 90 seconds for complex analysis
        }
      );

      const analysis = response.data;

      // Add analysis as system message
      await session.addMessage('system', JSON.stringify(analysis), {
        type: 'analysis',
        analysisType
      });

      logger.info(`Papers analyzed in session: ${session.name}`);

      res.status(200).json({
        success: true,
        data: { analysis }
      });

    } catch (aiError) {
      logger.error('AI analysis error:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate analysis. AI service unavailable.'
      });
    }

  } catch (error) {
    logger.error('Analyze papers error:', error);
    next(error);
  }
};

/**
 * @desc    Generate summary of conversation
 * @route   GET /api/v1/chat/:sessionId/summary
 * @access  Private
 */
const generateSummary = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.messages.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Not enough conversation to summarize'
      });
    }

    // Call AI service to generate summary
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
      const response = await axios.post(
        `${aiServiceUrl}/api/v1/chat/summarize`,
        {
          messages: session.messages,
          sessionName: session.name
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      const summary = response.data.summary;

      // Update session context
      session.context.summary = summary;
      await session.save();

      res.status(200).json({
        success: true,
        data: { summary }
      });

    } catch (aiError) {
      logger.error('AI summary error:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate summary'
      });
    }

  } catch (error) {
    logger.error('Generate summary error:', error);
    next(error);
  }
};

/**
 * @desc    Export chat transcript
 * @route   GET /api/v1/chat/:sessionId/export
 * @access  Private
 */
const exportTranscript = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    }).populate('papers.paper', 'title authors');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'markdown':
        exportData = generateMarkdownTranscript(session);
        contentType = 'text/markdown';
        filename = `${session.name.replace(/\s+/g, '-')}-transcript.md`;
        break;

      case 'txt':
        exportData = generateTextTranscript(session);
        contentType = 'text/plain';
        filename = `${session.name.replace(/\s+/g, '-')}-transcript.txt`;
        break;

      case 'json':
      default:
        exportData = JSON.stringify(session.messages, null, 2);
        contentType = 'application/json';
        filename = `${session.name.replace(/\s+/g, '-')}-transcript.json`;
        break;
    }

    // Record export
    session.exports.push({
      format,
      exportedAt: new Date()
    });
    await session.save();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    logger.error('Export transcript error:', error);
    next(error);
  }
};

// Helper function to generate markdown transcript
function generateMarkdownTranscript(session) {
  let markdown = `# ${session.name}\n\n`;
  markdown += `**Created:** ${session.createdAt.toLocaleDateString()}\n`;
  markdown += `**Papers:** ${session.papers.length}\n\n`;
  
  if (session.papers.length > 0) {
    markdown += `## Papers in Session\n\n`;
    session.papers.forEach((p, i) => {
      markdown += `${i + 1}. **${p.paper.title}**\n`;
      markdown += `   *${p.paper.authors.map(a => a.name).join(', ')}*\n\n`;
    });
  }

  markdown += `## Conversation\n\n`;
  session.messages.forEach(msg => {
    const timestamp = msg.timestamp.toLocaleString();
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `### ${role} - ${timestamp}\n\n${msg.content}\n\n---\n\n`;
  });

  return markdown;
}

// Helper function to generate text transcript
function generateTextTranscript(session) {
  let text = `${session.name}\n`;
  text += `${'='.repeat(session.name.length)}\n\n`;
  text += `Created: ${session.createdAt.toLocaleDateString()}\n`;
  text += `Papers: ${session.papers.length}\n\n`;
  
  session.messages.forEach(msg => {
    const timestamp = msg.timestamp.toLocaleString();
    const role = msg.role.toUpperCase();
    text += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
  });

  return text;
}

export {
  sendMessage,
  getMessages,
  clearMessages,
  analyzePapers,
  generateSummary,
  exportTranscript
};