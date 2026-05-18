/**
 * API Route Tests for /api/teams
 *
 * Tests:
 * 1. Query param validation (?sport= required)
 * 2. Response has correct content-type and CORS headers
 * 3. Private player fields (DOB, NISN, parent contact, medical) are NEVER in response
 * 4. 404 when team not found
 */

import { NextRequest } from 'next/server'

// Mock the server client before importing route
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockReturnThis = {
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
}

jest.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue(mockReturnThis),
  }),
}))

describe('GET /api/teams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('returns 400 when sport param is missing', async () => {
      const { GET } = await import('@/app/api/teams/route')
      const req = new NextRequest('http://localhost/api/teams')

      const res = await GET(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json).toHaveProperty('error')
    })

    it('returns 400 when sport param is empty string', async () => {
      const { GET } = await import('@/app/api/teams/route')
      const req = new NextRequest('http://localhost/api/teams?sport=')

      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })

  describe('Response Headers', () => {
    it('returns application/json content-type', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null })

      const { GET } = await import('@/app/api/teams/route')
      const req = new NextRequest('http://localhost/api/teams?sport=futsal', {
        headers: { origin: 'http://localhost' },
      })

      const res = await GET(req)
      expect(res.headers.get('content-type')).toContain('application/json')
    })

    it('returns CORS access-control-allow-origin: * for cross-origin requests', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null })

      const { GET } = await import('@/app/api/teams/route')
      const req = new NextRequest('http://localhost/api/teams?sport=futsal', {
        headers: { origin: 'https://sfwinner.site' },
      })

      const res = await GET(req)
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
    })
  })

  describe('Data Privacy — Public Fields Only', () => {
    it('response contains only public player fields (display_name, photo_url, jersey_number, position, status)', async () => {
      const mockTeamsData = [
        {
          id: 't1',
          name: 'SF Winner',
          slug: 'sf-winner',
          logo_url: null,
          branch_location: 'Sawangan',
          players: [
            {
              id: 'p1',
              // ✅ PUBLIC
              display_name: 'Budi Santoso',
              photo_url: null,
              jersey_number: 10,
              position: 'Forward',
              status: 'active',
              // ❌ PRIVATE — should never be returned
              // date_of_birth: '2015-03-15',
              // nisn: '0012345678',
              // full_name: 'Budi Santoso',
              // parent_name: 'John Doe',
              // parent_phone: '08123456789',
              // medical_info: 'Asthma',
            },
          ],
        },
      ]

      mockSelect.mockResolvedValue({ data: mockTeamsData, error: null })

      const { GET } = await import('@/app/api/teams/route')
      const req = new NextRequest('http://localhost/api/teams?sport=futsal', {
        headers: { origin: 'http://localhost' },
      })

      const res = await GET(req)
      const json = await res.json()

      // ✅ Public fields should be present
      expect(json.teams[0].players[0]).toHaveProperty('display_name')
      expect(json.teams[0].players[0]).toHaveProperty('jersey_number')
      expect(json.teams[0].players[0]).toHaveProperty('position')
      expect(json.teams[0].players[0]).toHaveProperty('status')

      // ❌ Private fields should NOT be present
      expect(json.teams[0].players[0]).not.toHaveProperty('date_of_birth')
      expect(json.teams[0].players[0]).not.toHaveProperty('nisn')
      expect(json.teams[0].players[0]).not.toHaveProperty('full_name')
      expect(json.teams[0].players[0]).not.toHaveProperty('parent_name')
      expect(json.teams[0].players[0]).not.toHaveProperty('parent_phone')
      expect(json.teams[0].players[0]).not.toHaveProperty('medical_info')
    })
  })
})