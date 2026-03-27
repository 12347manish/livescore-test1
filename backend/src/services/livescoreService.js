const sportmonksClient = require('../config/sportmonks');
const cacheService = require('./cacheService');
require('dotenv').config();

const CACHE_TTL = {
  MATCH: parseInt(process.env.CACHE_LIVE_SCORES_TTL) || 15,    // 15s for live data
  TEAMS: parseInt(process.env.CACHE_MATCH_DETAILS_TTL) || 300  // 5min for team info
};

// Team name aliases for fuzzy matching
const TEAM_ALIASES = {
  RCB: ['royal challengers bangalore', 'rcb', 'royal challengers'],
  SRH: ['sunrisers hyderabad', 'srh', 'sunrisers']
};

/**
 * Livescore Service - Fetches RCB vs SRH IPL match data from SportMonks
 */
class LivescoreService {

  /**
   * Normalize team name for matching
   */
  _normalizeTeamName(name) {
    return (name || '').toLowerCase().trim();
  }

  /**
   * Check if a team name matches RCB or SRH
   */
  _matchTeam(name, teamKey) {
    const normalized = this._normalizeTeamName(name);
    return TEAM_ALIASES[teamKey].some(alias => normalized.includes(alias));
  }

  /**
   * Search for RCB and SRH teams from SportMonks API
   */
  async getTeams() {
    const cacheKey = 'livescore:ipl_teams';

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return { success: true, source: 'cache', data: cached };
      }

      // Fetch both teams in parallel
      const [rcbResult, srhResult] = await Promise.all([
        sportmonksClient.searchCricketTeams('Royal Challengers'),
        sportmonksClient.searchCricketTeams('Sunrisers Hyderabad')
      ]);

      const rcbTeam = (rcbResult.data || []).find(t =>
        this._matchTeam(t.name, 'RCB') || this._matchTeam(t.short_name, 'RCB')
      ) || null;

      const srhTeam = (srhResult.data || []).find(t =>
        this._matchTeam(t.name, 'SRH') || this._matchTeam(t.short_name, 'SRH')
      ) || null;

      const data = {
        rcb: rcbTeam ? {
          id: rcbTeam.id,
          name: rcbTeam.name,
          short_name: rcbTeam.short_name || 'RCB',
          image_path: rcbTeam.image_path || null
        } : null,
        srh: srhTeam ? {
          id: srhTeam.id,
          name: srhTeam.name,
          short_name: srhTeam.short_name || 'SRH',
          image_path: srhTeam.image_path || null
        } : null,
        timestamp: Date.now()
      };

      await cacheService.set(cacheKey, data, CACHE_TTL.TEAMS);

      return { success: true, source: 'api', data };

    } catch (error) {
      console.error('❌ Error fetching IPL teams:', error.message);
      // Return default data on error
      return {
        success: false,
        source: 'fallback',
        error: error.message,
        data: {
          rcb: { id: null, name: 'Royal Challengers Bangalore', short_name: 'RCB', image_path: null },
          srh: { id: null, name: 'Sunrisers Hyderabad', short_name: 'SRH', image_path: null },
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Find the RCB vs SRH match (live or upcoming tomorrow)
   */
  async getMatch() {
    const cacheKey = 'livescore:rcb_vs_srh_match';

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return { success: true, source: 'cache', data: cached };
      }

      // Try live scores first
      let match = await this._findInLiveScores();

      // If not live, try upcoming fixtures
      if (!match) {
        match = await this._findInUpcomingFixtures();
      }

      if (!match) {
        return {
          success: false,
          source: 'api',
          error: 'No RCB vs SRH IPL match found (live or upcoming tomorrow)',
          data: this._buildFallbackMatch()
        };
      }

      const ttl = match.status === 'live' ? CACHE_TTL.MATCH : 60;
      await cacheService.set(cacheKey, match, ttl);

      return { success: true, source: 'api', data: match };

    } catch (error) {
      console.error('❌ Error fetching RCB vs SRH match:', error.message);
      return {
        success: false,
        source: 'error',
        error: error.message,
        data: this._buildFallbackMatch()
      };
    }
  }

  /**
   * Search live scores for RCB vs SRH match
   */
  async _findInLiveScores() {
    try {
      const result = await sportmonksClient.getCricketLiveScoresFull();
      const fixtures = result.data || [];

      return fixtures.find(f => this._isRcbVsSrhMatch(f)) || null;
    } catch (err) {
      console.warn('⚠️ Could not fetch live scores:', err.message);
      return null;
    }
  }

  /**
   * Search upcoming fixtures for RCB vs SRH match
   */
  async _findInUpcomingFixtures() {
    try {
      const result = await sportmonksClient.getUpcomingCricketFixtures();
      const fixtures = result.data || [];

      const match = fixtures.find(f => this._isRcbVsSrhMatch(f));
      if (!match) return null;

      // Fetch full details for the found fixture
      try {
        const detailed = await sportmonksClient.getCricketFixtureById(match.id);
        return this._transformFixture(detailed.data, 'upcoming');
      } catch (_) {
        return this._transformFixture(match, 'upcoming');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch upcoming fixtures:', err.message);
      return null;
    }
  }

  /**
   * Determine if a fixture is the RCB vs SRH match
   */
  _isRcbVsSrhMatch(fixture) {
    const local = fixture.localTeam || fixture.local_team || {};
    const visitor = fixture.visitorTeam || fixture.visitor_team || {};
    const localName = local.name || local.code || '';
    const visitorName = visitor.name || visitor.code || '';

    const isRcbLocal = this._matchTeam(localName, 'RCB');
    const isSrhLocal = this._matchTeam(localName, 'SRH');
    const isRcbVisitor = this._matchTeam(visitorName, 'RCB');
    const isSrhVisitor = this._matchTeam(visitorName, 'SRH');

    return (isRcbLocal && isSrhVisitor) || (isSrhLocal && isRcbVisitor);
  }

  /**
   * Transform SportMonks fixture data into a standardized format
   */
  _transformFixture(fixture, statusOverride) {
    if (!fixture) return null;

    const local = fixture.localTeam || fixture.local_team || {};
    const visitor = fixture.visitorTeam || fixture.visitor_team || {};
    const score = fixture.score || fixture.scoreboards || [];
    const status = statusOverride || this._resolveStatus(fixture.status);

    // Parse scores
    const localScore = this._parseScore(score, local.id, 'local');
    const visitorScore = this._parseScore(score, visitor.id, 'visitor');

    // Determine RCB and SRH
    const localIsRcb = this._matchTeam(local.name || '', 'RCB');

    return {
      fixture_id: fixture.id,
      status,
      league: (fixture.league && fixture.league.name) || 'IPL 2025',
      starting_at: fixture.starting_at || fixture.date || null,
      note: fixture.note || '',
      rcb: {
        id: localIsRcb ? local.id : visitor.id,
        name: localIsRcb ? (local.name || 'Royal Challengers Bangalore') : (visitor.name || 'Royal Challengers Bangalore'),
        short_name: 'RCB',
        image_path: localIsRcb ? (local.image_path || null) : (visitor.image_path || null),
        score: localIsRcb ? localScore : visitorScore
      },
      srh: {
        id: localIsRcb ? visitor.id : local.id,
        name: localIsRcb ? (visitor.name || 'Sunrisers Hyderabad') : (local.name || 'Sunrisers Hyderabad'),
        short_name: 'SRH',
        image_path: localIsRcb ? (visitor.image_path || null) : (local.image_path || null),
        score: localIsRcb ? visitorScore : localScore
      },
      toss: fixture.tosswon_team_id ? {
        won_by_id: fixture.tosswon_team_id,
        decision: fixture.elected
      } : null,
      timestamp: Date.now()
    };
  }

  /**
   * Parse score for a team from the scoreboards
   */
  _parseScore(scoreboards, teamId, type) {
    if (!Array.isArray(scoreboards) || scoreboards.length === 0) {
      return { runs: null, wickets: null, overs: null, display: '--' };
    }

    // Try to find team-specific entry in the scoreboards array.
    // Entries with an innings value indicate ball-by-ball breakdowns;
    // we skip those and only use the summary-level entry (no innings key).
    let entry = scoreboards.find(s =>
      (s.team_id === teamId || s.type === type) && !s.innings
    );

    // Fallback to first entry of matching type
    if (!entry) {
      entry = scoreboards.find(s => s.type === type);
    }

    if (!entry) {
      return { runs: null, wickets: null, overs: null, display: '--' };
    }

    const runs = entry.total !== undefined ? entry.total : entry.runs;
    const wickets = entry.wickets !== undefined ? entry.wickets : null;
    const overs = entry.overs !== undefined ? entry.overs : null;

    let display = '--';
    if (runs !== null && runs !== undefined) {
      display = wickets !== null ? `${runs}/${wickets}` : `${runs}`;
      // Overs are rendered separately in the UI; exclude them from the display string
    }

    return { runs, wickets, overs, display };
  }

  /**
   * Map SportMonks status to standard status
   */
  _resolveStatus(status) {
    if (!status) return 'upcoming';
    const s = status.toLowerCase();
    if (s.includes('live') || s.includes('progress') || s === 'inprogress') return 'live';
    if (s.includes('finish') || s.includes('complet') || s.includes('ended')) return 'completed';
    return 'upcoming';
  }

  /**
   * Build a fallback match object when API is unavailable
   */
  _buildFallbackMatch() {
    // Build the tomorrow fallback date using UTC+5:30 (IST) at 19:30
    const tomorrow = new Date();
    // Add 1 day and set to 14:00 UTC (= 19:30 IST, a typical IPL start time)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(14, 0, 0, 0); // 14:00 UTC = 19:30 IST

    return {
      fixture_id: null,
      status: 'upcoming',
      league: 'IPL 2025',
      starting_at: tomorrow.toISOString(),
      note: 'Data unavailable - API error',
      rcb: {
        id: null,
        name: 'Royal Challengers Bangalore',
        short_name: 'RCB',
        image_path: null,
        score: { runs: null, wickets: null, overs: null, display: '--' }
      },
      srh: {
        id: null,
        name: 'Sunrisers Hyderabad',
        short_name: 'SRH',
        image_path: null,
        score: { runs: null, wickets: null, overs: null, display: '--' }
      },
      toss: null,
      timestamp: Date.now()
    };
  }
}

module.exports = new LivescoreService();
