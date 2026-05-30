import { createClient } from '@/lib/supabase/server'

export default async function AthletesPage() {
  const supabase = await createClient()
  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('pool', 'pro')
    .eq('is_active', true)
    .order('last_name')
    .limit(50)

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-black text-white">Athletes</h1>

      {athletes && athletes.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#2A2A2A]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-400">Athlete</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-400">Country</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-400">Event</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">Salary</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete) => (
                <tr key={athlete.id} className="border-b border-[#1A1A1A] hover:bg-[#1A1A1A]">
                  <td className="px-4 py-3 font-medium text-white">
                    {athlete.first_name} {athlete.last_name}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{athlete.country_code}</td>
                  <td className="px-4 py-3 text-zinc-400">{athlete.primary_event}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#E8FF00]">
                    ${(athlete.salary / 1000).toFixed(1)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center text-zinc-500">
          ⚡ Athletes will appear once seed data is loaded.
        </div>
      )}
    </div>
  )
}
