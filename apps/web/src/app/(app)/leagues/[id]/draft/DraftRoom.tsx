'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { snakePickerIndex } from '@fieldday/shared'

interface Athlete {
  id: string
  first_name: string
  last_name: string
  primary_event: string
  country_code: string
  salary: number
  gender: string
}

interface Member {
  user_id: string
  draft_order: number | null
  role: string
  display_name: string
}

interface Pick {
  pick_number: number
  user_id: string
  athlete_id: string
  salary: number
  athlete: { first_name: string; last_name: string; primary_event: string } | null
}

interface League {
  id: string
  name: string
  draft_status: string
  season: { id: string; name: string; salary_cap: number; roster_size: number; starting_slots: number }
}

interface Props {
  leagueId: string
  currentUserId: string
  league: League
  members: Member[]
  athletes: Athlete[]
  initialPicks: Pick[]
}

export function DraftRoom({ leagueId, currentUserId, league, members, athletes, initialPicks }: Props) {
  const [picks, setPicks] = useState<Pick[]>(initialPicks)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'men' | 'women'>('all')
  const [isPicking, setIsPicking] = useState(false)
  const [error, setError] = useState('')

  const salaryCap = league.season.salary_cap
  const rosterSize = league.season.roster_size
  const totalPicks = members.length * rosterSize
  const currentPickNumber = picks.length + 1
  const isDraftComplete = members.length > 0 && totalPicks > 0 && picks.length >= totalPicks

  const currentDraftOrder = isDraftComplete ? null : snakePickerIndex(currentPickNumber, members.length)
  const currentPicker = members.find((m) => m.draft_order === currentDraftOrder)
  const isMyTurn = currentPicker?.user_id === currentUserId

  const pickedAthleteIds = useMemo(() => new Set(picks.map((p) => p.athlete_id)), [picks])

  const myPicks = picks.filter((p) => p.user_id === currentUserId)
  const mySalaryUsed = myPicks.reduce((sum, p) => sum + p.salary, 0)
  const mySalaryRemaining = salaryCap - mySalaryUsed
  const myPicksLeft = rosterSize - myPicks.length

  // Subscribe to new picks via Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`draft-${leagueId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'draft_picks', filter: `league_id=eq.${leagueId}` },
        async (payload) => {
          const newPick = payload.new as { pick_number: number; user_id: string; athlete_id: string; salary: number }
          // Fetch athlete info
          const { data: athlete } = await supabase
            .from('athletes')
            .select('first_name, last_name, primary_event')
            .eq('id', newPick.athlete_id)
            .single()

          setPicks((prev) => {
            if (prev.some((p) => p.pick_number === newPick.pick_number)) return prev
            return [...prev, { ...newPick, athlete }].sort((a, b) => a.pick_number - b.pick_number)
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [leagueId])

  const uniqueEvents = useMemo(() => {
    const events = new Set(athletes.map((a) => a.primary_event))
    return ['all', ...Array.from(events).sort()]
  }, [athletes])

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (pickedAthleteIds.has(a.id)) return false
      if (genderFilter !== 'all' && a.gender !== genderFilter) return false
      if (eventFilter !== 'all' && a.primary_event !== eventFilter) return false
      if (search.length > 1) {
        const q = search.toLowerCase()
        if (!`${a.first_name} ${a.last_name}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [athletes, pickedAthleteIds, genderFilter, eventFilter, search])

  async function makePick(athleteId: string) {
    if (!isMyTurn || isPicking) return
    setIsPicking(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/make-draft-pick`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ leagueId, athleteId }),
      },
    )

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Pick failed')
    }
    setIsPicking(false)
  }

  const round = Math.ceil(currentPickNumber / members.length)

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] bg-[#111] px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">{league.name} · {league.season.name}</p>
          {isDraftComplete ? (
            <p className="font-bold text-[#E8FF00]">Draft Complete!</p>
          ) : (
            <p className="font-bold text-white">
              Round {round} · Pick {currentPickNumber} of {totalPicks}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">
            ${(mySalaryRemaining / 1000).toFixed(1)}K left
          </p>
          <p className="text-xs text-zinc-500">{myPicksLeft} picks remaining</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Draft order sidebar */}
        <div className="hidden w-44 shrink-0 flex-col border-r border-[#2A2A2A] bg-[#111] overflow-y-auto md:flex">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-600">Draft Order</p>
          {members.map((member) => {
            const isCurrent = member.draft_order === currentDraftOrder && !isDraftComplete
            const memberPicks = picks.filter((p) => p.user_id === member.user_id).length
            return (
              <div
                key={member.user_id}
                className={`px-3 py-2.5 border-b border-[#1A1A1A] ${isCurrent ? 'bg-[#E8FF00]/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-4 ${isCurrent ? 'text-[#E8FF00]' : 'text-zinc-600'}`}>
                    {member.draft_order}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${
                      member.user_id === currentUserId ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {member.display_name}
                      {member.user_id === currentUserId && ' (you)'}
                    </p>
                    <p className="text-xs text-zinc-600">{memberPicks}/{rosterSize}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Turn banner */}
          {!isDraftComplete && (
            <div className={`px-4 py-2.5 text-sm font-semibold ${
              isMyTurn ? 'bg-[#E8FF00] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-zinc-400'
            }`}>
              {isMyTurn
                ? '⚡ It\'s your pick!'
                : `Waiting for ${currentPicker?.display_name ?? 'opponent'}…`}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 border-b border-[#2A2A2A] bg-[#111] p-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes…"
              className="flex-1 min-w-32 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as 'all' | 'men' | 'women')}
              className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              {uniqueEvents.map((e) => (
                <option key={e} value={e}>{e === 'all' ? 'All events' : e}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mx-4 mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Athlete list */}
          <div className="flex-1 overflow-y-auto">
            {isDraftComplete ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center">
                <p className="text-2xl font-black text-[#E8FF00]">Draft Complete!</p>
                <p className="text-zinc-500">All rosters are set. Good luck!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {filteredAthletes.map((athlete) => {
                  const affordable = athlete.salary <= mySalaryRemaining - (myPicksLeft - 1) * 1000
                  return (
                    <div
                      key={athlete.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        isMyTurn && affordable ? 'hover:bg-[#1A1A1A] cursor-pointer' : 'opacity-60'
                      }`}
                      onClick={() => isMyTurn && affordable && makePick(athlete.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {athlete.first_name} {athlete.last_name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {athlete.country_code} · {athlete.primary_event}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#E8FF00]">
                          ${(athlete.salary / 1000).toFixed(1)}K
                        </span>
                        {isMyTurn && affordable && (
                          <button
                            onClick={(e) => { e.stopPropagation(); makePick(athlete.id) }}
                            disabled={isPicking}
                            className="rounded-lg bg-[#E8FF00] px-3 py-1.5 text-xs font-bold text-[#0D0D0D] disabled:opacity-50"
                          >
                            {isPicking ? '…' : 'Pick'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredAthletes.length === 0 && (
                  <p className="p-8 text-center text-zinc-600">No available athletes match your filters.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* My roster sidebar */}
        <div className="hidden w-48 shrink-0 flex-col border-l border-[#2A2A2A] bg-[#111] overflow-y-auto lg:flex">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-600">My Roster</p>
          {myPicks.length === 0 && (
            <p className="px-3 py-4 text-xs text-zinc-600">No picks yet.</p>
          )}
          {myPicks.map((pick, i) => {
            const athlete = pick.athlete
            const slotLabel = i === 0 ? 'C' : i < league.season.starting_slots ? `S${i}` : `B${i - league.season.starting_slots + 1}`
            return (
              <div key={pick.pick_number} className="border-b border-[#1A1A1A] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-[#E8FF00]' : 'text-zinc-600'}`}>
                    {slotLabel}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {athlete?.first_name} {athlete?.last_name}
                    </p>
                    <p className="text-xs text-zinc-600">${(pick.salary / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            )
          })}
          {myPicks.length > 0 && (
            <div className="mt-auto border-t border-[#2A2A2A] px-3 py-2">
              <p className="text-xs text-zinc-500">Used: ${(mySalaryUsed / 1000).toFixed(1)}K</p>
              <p className="text-xs font-semibold text-[#E8FF00]">Left: ${(mySalaryRemaining / 1000).toFixed(1)}K</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
