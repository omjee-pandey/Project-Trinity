const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced WebSocket Server Configuration
const wss = new WebSocket.Server({
  server,
  path: '/ws',
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    threshold: 1024
  }
});

// CORS Configuration
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

// WebSocket Connection Management
const clients = new Set();

class CompetitionScraper {
  constructor() {
    this.previousCompetitions = [];
  }

  async scrapeCompetitions() {
    const browser = await chromium.launch({
      headless: true,
      timeout: 60000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate with multiple wait options
      await page.goto('https://kheloindia.gov.in', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Try multiple selector strategies
      let competitions = [];
      const selectorsToTry = [
        '.event-card',
        '.event-item',
        '.competition-card',
        '.upcoming-events li',
        '.event-list > div'
      ];

      for (const selector of selectorsToTry) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          competitions = await page.evaluate((sel) => {
            const cards = document.querySelectorAll(sel);
            return Array.from(cards).map(card => ({
              name: card.querySelector('.event-title, .title, .name')?.textContent?.trim() || 'Unknown',
              date: card.querySelector('.event-date, .date, .time')?.textContent?.trim() || 'TBD',
              location: card.querySelector('.event-location, .location, .venue')?.textContent?.trim() || 'Unknown',
              status: card.querySelector('.event-status, .status, .tag')?.textContent?.trim() || 'Upcoming',
              link: card.querySelector('a')?.href || ''
            }));
          }, selector);
          
          if (competitions.length > 0) break;
        } catch (err) {
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }

      if (competitions.length === 0) {
        console.warn('No competitions found with any selector');
        return [{
          name: "Khelo India Winter Games",
          date: "23-27 Jan 2025",
          location: "Leh Ladakh",
          status: "Upcoming"
        }];
      }

      return competitions;
    } catch (error) {
      console.error('Scraping failed:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  hasCompetitionsChanged(newCompetitions) {
    if (newCompetitions.length !== this.previousCompetitions.length) return true;
    return newCompetitions.some((comp, index) => 
      JSON.stringify(comp) !== JSON.stringify(this.previousCompetitions[index])
    );
  }
}

// WebSocket Server
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.headers.origin);
  clients.add(ws);

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    clients.delete(ws);
  });
});

// Heartbeat to keep connections alive
setInterval(() => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);

// Initialize scraper
const scraper = new CompetitionScraper();

// API Endpoints
app.get('/competitions', async (req, res) => {
  try {
    const competitions = await scraper.scrapeCompetitions();
    res.json(competitions);
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Prompt must be a non-empty string'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.9,
      }
    });

    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, response: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    let errorMessage = 'Failed to generate content';
    if (error.message.includes('API key not valid')) errorMessage = 'Invalid API key';
    if (error.message.includes('model not found')) errorMessage = 'Model not available';
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// Scheduled scraping
// In the scheduled scraping section
cron.schedule('0 * * * *', async () => {
  try {
    const newCompetitions = await scraper.scrapeCompetitions();
    if (scraper.hasCompetitionsChanged(newCompetitions)) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'competitions',
            payload: newCompetitions.length > 0 ? newCompetitions : [{
              name: "Khelo India Winter Games (Fallback)",
              date: "Coming Soon",
              location: "India",
              status: "Upcoming"
            }]
          }));  
        }
      });
      scraper.previousCompetitions = newCompetitions;
    }
  } catch (error) {
    console.error('Scheduled scraping failed:', error);
  }
});
// Server startup
server.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
  console.log(`WebSocket endpoint: ws://localhost:${process.env.PORT || 5000}/ws`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});