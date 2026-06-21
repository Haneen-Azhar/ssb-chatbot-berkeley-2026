import { describe, it, expect, beforeEach } from 'vitest';
import { rebuildCampusMemoryIndex, searchCampusMemory, getCampusMemoryChunkCount } from '../lib/campusMemoryIndex.js';

const ROSTER_CONTENT = `[Architecture Roster S2]
Name: Lyla | Course: Architecture | Program Type: Commuter | Phone Number: 6504672822
Name: Alexa | Course: Architecture | Program Type: Residential | Phone Number: 6192040224
Name: Emre | Course: Architecture | Program Type: Commuter | Phone Number: 8584058290

[Pre-Med Roster S2]
Name: Birch | Course: Pre-Med | Program Type: Commuter | Phone Number: 3232038071
Name: Geronimo | Course: Biotechnology | Program Type: Commuter | Phone Number: 7864982054`;

const MENTOR_ROLES_CONTENT = `[Mentor Roles S2]
Name: Aknur | Floor: Floor 2 | Mentor Role: Architecture | Classroom Location: U2 Wada L12 | Club activity: Yap and Walk
Name: Madina | Mentor Role: Office/Commuter Mentor | Classroom Location: Office 103 | Club activity: Creative club`;

const GROUP_CONTENT = `[Mentor Session 2 groups]
Mentor GROUP 1 Osa - 7 (S2) - Wolves: First Name | Mentor GROUP 4 Taras - 7 - Seals: First Name
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Andrea | Mentor GROUP 4 Taras - 7 - Seals: Divya
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Kathleen | Mentor GROUP 4 Taras - 7 - Seals: Arman
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Zachary
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Mentor GROUP 2 Valentina - 7 (S2) - Bears | Mentor GROUP 4 Taras - 7 - Seals: Mentor GROUP 5 Aoife - 7 - Eagles
Mentor GROUP 1 Osa - 7 (S2) - Wolves: First Name | Mentor GROUP 4 Taras - 7 - Seals: First Name
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Krista | Mentor GROUP 4 Taras - 7 - Seals: James
Mentor GROUP 1 Osa - 7 (S2) - Wolves: Brynn | Mentor GROUP 4 Taras - 7 - Seals: Manya`;

describe('campusMemoryIndex', () => {
  beforeEach(() => {
    rebuildCampusMemoryIndex([
      { id: 1, title: 'Test Roster', content: ROSTER_CONTENT },
      { id: 2, title: 'Test Roles', content: MENTOR_ROLES_CONTENT },
      { id: 3, title: 'Test Groups', content: GROUP_CONTENT },
    ]);
  });

  it('chunks content by section headers', () => {
    expect(getCampusMemoryChunkCount()).toBeGreaterThanOrEqual(4);
  });

  describe('structured record extraction', () => {
    it('finds phone numbers by name', () => {
      const result = searchCampusMemory('lylas phone');
      expect(result).toContain('6504672822');
      expect(result).toContain('Lyla');
    });

    it('finds phone numbers without apostrophe', () => {
      const result = searchCampusMemory('birch phone number');
      expect(result).toContain('3232038071');
    });

    it('finds mentor roles by name', () => {
      const result = searchCampusMemory('aknur role');
      expect(result).toContain('Aknur');
      expect(result).toContain('Architecture');
    });

    it('handles possessives without apostrophes', () => {
      const result = searchCampusMemory('aknurs mentor role');
      expect(result).toContain('Aknur');
    });

    it('returns person details for who-is queries', () => {
      const result = searchCampusMemory('who is madina');
      expect(result).toContain('Madina');
      expect(result).toContain('Office/Commuter Mentor');
    });
  });

  describe('mentor group extraction', () => {
    it('correctly assigns students to group 1', () => {
      const result = searchCampusMemory('osas students');
      expect(result).toContain('Osa');
      expect(result).toContain('Wolves');
      expect(result).toContain('Andrea');
      expect(result).toContain('Kathleen');
      expect(result).toContain('Zachary');
      // Should NOT contain group 2 members
      expect(result).not.toContain('Krista');
    });

    it('correctly assigns students to group 2 after divider', () => {
      const result = searchCampusMemory('valentinas students');
      expect(result).toContain('Bears');
      expect(result).toContain('Krista');
      expect(result).toContain('Brynn');
      // Should NOT contain group 1 members
      expect(result).not.toContain('Andrea');
    });

    it('finds groups by number', () => {
      const result = searchCampusMemory('who is in group 1');
      expect(result).toContain('Osa');
      expect(result).toContain('Wolves');
    });

    it('finds groups by animal name', () => {
      const result = searchCampusMemory('wolves group');
      expect(result).toContain('Osa');
    });
  });

  describe('chunk-based search fallback', () => {
    it('returns chunk results when no structured match', () => {
      const result = searchCampusMemory('architecture classroom location');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns default context for empty queries', () => {
      const result = searchCampusMemory('');
      expect(result).toContain('CAMPUS-SPECIFIC INFORMATION');
    });
  });
});
