const { io } = require('../config/socket');
const cacheService = require('./cacheService');

const rawMockData = [
  {
    "id": 19427530,
    "sport_id": 1,
    "league_id": 8,
    "season_id": 25583,
    "stage_id": 77476879,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 372202,
    "state_id": 5,
    "venue_id": 151,
    "name": "Manchester City vs Everton",
    "starting_at": "2025-10-18 14:00:00",
    "result_info": null,
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "has_odds": true,
    "has_premium_odds": true,
    "starting_at_timestamp": 1760796000,
    "participants": [
      {
        "id": 13,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 343762,
        "gender": "male",
        "name": "Everton",
        "short_code": "EVE",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/13/13.png",
        "founded": 1878,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-21 17:30:00",
        "meta": { "location": "away", "position": 8, "winner": false }
      },
      {
        "id": 9,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 151,
        "gender": "male",
        "name": "Manchester City",
        "short_code": "MCI",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/9/9.png",
        "founded": 1880,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-22 16:30:00",
        "meta": { "location": "home", "position": 5, "winner": false }
      }
    ],
    "league": {
      "id": 8,
      "sport_id": 1,
      "country_id": 462,
      "name": "Premier League",
      "active": true,
      "short_code": "UK PL",
      "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      "type": "league",
      "sub_type": "domestic",
      "last_played_at": "2026-03-22 14:15:00",
      "category": 1,
      "has_jerseys": false,
      "country": {
        "id": 462,
        "continent_id": 1,
        "name": "England",
        "official_name": "England",
        "fifa_name": "ENG",
        "iso2": "EN",
        "iso3": "ENG",
        "latitude": "54.56088638305664",
        "longitude": "-2.2125117778778076",
        "borders": [ "IRL" ],
        "image_path": "https://cdn.sportmonks.com/images/countries/png/short/en.png"
      }
    },
    "scores": [],
    "events": [],
    "periods": [],
    "round": {
      "id": 372202,
      "sport_id": 1,
      "league_id": 8,
      "season_id": 25583,
      "stage_id": 77476879,
      "name": "8",
      "finished": true,
      "is_current": false,
      "starting_at": "2025-10-18",
      "ending_at": "2025-10-20",
      "games_in_current_week": false
    }
  },
  {
    "id": 19427525,
    "sport_id": 1,
    "league_id": 8,
    "season_id": 25583,
    "stage_id": 77476879,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 372202,
    "state_id": 5,
    "venue_id": 480,
    "name": "Brighton & Hove Albion vs Newcastle United",
    "starting_at": "2025-10-18 14:00:00",
    "result_info": null,
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "has_odds": true,
    "has_premium_odds": true,
    "starting_at_timestamp": 1760796000,
    "participants": [
      {
        "id": 78,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 480,
        "gender": "male",
        "name": "Brighton & Hove Albion",
        "short_code": "BHA",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/14/78.png",
        "founded": 1901,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-14 15:00:00",
        "meta": { "location": "home", "position": 12, "winner": false }
      },
      {
        "id": 20,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 449,
        "gender": "male",
        "name": "Newcastle United",
        "short_code": "NEW",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/20/20.png",
        "founded": 1892,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-22 12:00:00",
        "meta": { "location": "away", "position": 11, "winner": false }
      }
    ],
    "league": {
      "id": 8,
      "sport_id": 1,
      "country_id": 462,
      "name": "Premier League",
      "active": true,
      " короткий_код": "UK PL",
      "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      "type": "league",
      "sub_type": "domestic",
      "last_played_at": "2026-03-22 14:15:00",
      "category": 1,
      "has_jerseys": false,
      "country": {
        "id": 462,
        "name": "England",
        "image_path": "https://cdn.sportmonks.com/images/countries/png/short/en.png"
      }
    },
    "scores": [],
    "events": [],
    "periods": [],
    "round": {
      "id": 372202,
      "name": "8"
    }
  },
  {
    "id": 19427526,
    "sport_id": 1,
    "league_id": 8,
    "season_id": 25583,
    "stage_id": 77476879,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 372202,
    "state_id": 5,
    "venue_id": 200,
    "name": "Burnley vs Leeds United",
    "starting_at": "2025-10-18 14:00:00",
    "result_info": null,
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "has_odds": true,
    "has_premium_odds": true,
    "starting_at_timestamp": 1760796000,
    "participants": [
      {
        "id": 27,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 200,
        "gender": "male",
        "name": "Burnley",
        "short_code": "BUR",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/27/27.png",
        "founded": 1882,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-21 15:00:00",
        "meta": { "location": "home", "position": 18, "winner": false }
      },
      {
        "id": 71,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 488,
        "gender": "male",
        "name": "Leeds United",
        "short_code": "LEE",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/7/71.png",
        "founded": 1919,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-21 20:00:00",
        "meta": { "location": "away", "position": 15, "winner": false }
      }
    ],
    "league": {
      "id": 8,
      "name": "Premier League",
      "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      "country": { "name": "England" }
    },
    "scores": [],
    "events": [],
    "periods": []
  },
  {
    "id": 19427527,
    "name": "Crystal Palace vs AFC Bournemouth",
    "participants": [
      {
        "id": 51,
        "name": "Crystal Palace",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/19/51.png",
        "meta": { "location": "home" }
      },
      {
        "id": 52,
        "name": "AFC Bournemouth",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/20/52.png",
        "meta": { "location": "away" }
      }
    ],
    "league": { "name": "Premier League", "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png" },
    "scores": [],
    "events": [],
    "periods": []
  },
  {
    "id": 19427528,
    "name": "Fulham vs Arsenal",
    "participants": [
      {
        "id": 11,
        "name": "Fulham",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/11/11.png",
        "meta": { "location": "home" }
      },
      {
        "id": 19,
        "name": "Arsenal",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
        "meta": { "location": "away" }
      }
    ],
    "league": { "name": "Premier League", "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png" },
    "scores": [],
    "events": [],
    "periods": []
  }
];

const mockEventPlayers = ['Haaland', 'Saka', 'Rashford', 'Mitoma', 'Odegaard', 'Saliba', 'Trippier', 'Gordon', 'Foden', 'Alvarez', 'Isak'];

class MockScoreService {
  constructor() {
    this.footballMatches = rawMockData.map(match => {
      // Create easily parsable localteam / visitorteam for backward compat if needed
      const localteam = match.participants.find(p => p.meta.location === 'home') || match.participants[0];
      const visitorteam = match.participants.find(p => p.meta.location === 'away') || match.participants[1];

      const initialMinute = Math.floor(Math.random() * 85) + 1;
      const initialHomeScore = Math.floor(Math.random() * 3);
      const initialAwayScore = Math.floor(Math.random() * 2);
      const initialPlayer = mockEventPlayers[Math.floor(Math.random() * mockEventPlayers.length)];

      const initialEvents = initialHomeScore > 0 || initialAwayScore > 0 ? [{
        id: Math.random() * 100000,
        type: 'GOAL',
        minute: initialMinute - 10 > 0 ? initialMinute - 10 : 1,
        player_name: initialPlayer,
        team_name: initialHomeScore > 0 ? localteam.name : visitorteam.name
      }] : [];

      return {
        ...match,
        localteam,
        visitorteam,
        score: { home: initialHomeScore, away: initialAwayScore },
        minute: initialMinute,
        status: 'LIVE',
        events: initialEvents
      };
    });

    this.cricketMatches = [];
    this.interval = null;
  }

  startSimulation() {
    if (this.interval) return;
    console.log('🧪 MOCK MODE ENABLED: Starting dummy data simulation...');
    
    this.interval = setInterval(() => {
      this.simulateFootballEvent();
    }, 8000); // 8s
  }

  stopSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  simulateFootballEvent() {
    // Pick random match
    const match = this.footballMatches[Math.floor(Math.random() * this.footballMatches.length)];
    const isHome = Math.random() > 0.5;
    
    // Increment minute
    match.minute += 1;
    if (match.minute > 95) match.minute = 1;

    // 40% chance for an event (Goal, Yellow Card)
    if (Math.random() > 0.6) {
      const isGoal = Math.random() > 0.3; // 70% chance it's a goal instead of a card
      const team = isHome ? match.localteam : match.visitorteam;
      const player = mockEventPlayers[Math.floor(Math.random() * mockEventPlayers.length)];

      if (isGoal) {
        if (isHome) match.score.home++; else match.score.away++;
      }

      const eventItem = {
        id: Math.random() * 100000,
        type: isGoal ? 'GOAL' : 'YELLOW CARD',
        minute: match.minute,
        player_name: player,
        team_name: team.name,
      };

      match.events.unshift(eventItem); // add to top
      if (match.events.length > 5) match.events.pop();

      const updateData = {
        fixture_id: match.id,
        sport: 'football',
        score: match.score,
        minute: match.minute,
        status: match.status,
        events: match.events,
        latest_event: eventItem,
        timestamp: Date.now()
      };

      io.to(`sport:football`).emit('score_update', updateData);
      io.to(`match:${match.id}`).emit('match_score_update', updateData);
      
      if (isGoal) {
        console.log(`⚽ MOCK GOAL! ${match.localteam.name} ${match.score.home} - ${match.score.away} ${match.visitorteam.name} (${player} - ${match.minute}')`);
      } else {
        console.log(`🟨 MOCK CARD! ${team.name} (${player} - ${match.minute}')`);
      }

      cacheService.setLiveScores('football', {
        data: this.footballMatches,
        timestamp: Date.now(),
        rateLimit: { remaining: 999, limit: 1000, resetTime: Date.now() + 3600000 }
      }, 15);
    } else {
      // Just emit a time update
      const updateData = {
        fixture_id: match.id,
        sport: 'football',
        score: match.score,
        minute: match.minute,
        status: match.status,
        events: match.events,
        timestamp: Date.now()
      };
      
      io.to(`sport:football`).emit('score_update', updateData);
    }
  }

  getLiveFootballScores() {
    return {
      success: true,
      source: 'mock',
      data: this.footballMatches,
      count: this.footballMatches.length,
      timestamp: Date.now(),
      cache_ttl: 15
    };
  }

  getLiveCricketScores() {
    return {
      success: true,
      source: 'mock',
      data: this.cricketMatches,
      count: this.cricketMatches.length,
      timestamp: Date.now(),
      cache_ttl: 15
    };
  }

  getMatchDetails(fixtureId, sport) {
    let match = null;
    if (sport === 'football') {
      match = this.footballMatches.find(m => m.id === parseInt(fixtureId));
    } else {
      match = this.cricketMatches.find(m => m.id === parseInt(fixtureId));
    }
    
    return {
      success: true,
      source: 'mock',
      data: match,
      timestamp: Date.now()
    };
  }
}

module.exports = new MockScoreService();
