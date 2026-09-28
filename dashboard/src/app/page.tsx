"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  CountryData,
  GlobalTrend,
  ContinentSummary,
  YearlyDeaths,
} from "@/types/covid";

export default function Home() {
  const [latest, setLatest] = useState<CountryData[]>([]);
  const [globalTrend, setGlobalTrend] = useState<GlobalTrend[]>([]);
  const [continentData, setContinentData] = useState<ContinentSummary[]>([]);
  const [yearlyDeaths, setYearlyDeaths] = useState<YearlyDeaths[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedContinent, setSelectedContinent] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [latestRes, trendRes, continentRes, yearlyRes] =
          await Promise.all([
            fetch("/data/latest.json"),
            fetch("/data/global_trend.json"),
            fetch("/data/continent_summary.json"),
            fetch("/data/yearly_deaths.json"),
          ]);

        setLatest(await latestRes.json());
        setGlobalTrend(await trendRes.json());
        setContinentData(await continentRes.json());
        setYearlyDeaths(await yearlyRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-400/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300 text-lg tracking-wide animate-pulse">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ========== FILTERING ==========
  let filtered = [...latest];
  if (selectedContinent !== "All") {
    filtered = filtered.filter((d) => d.continent === selectedContinent);
  }
  if (selectedCountry !== "All") {
    filtered = filtered.filter((d) => d.country === selectedCountry);
  }

  const continents = [
    "All",
    ...Array.from(
      new Set(latest.map((d) => d.continent).filter(Boolean)),
    ).sort(),
  ];

  const countries =
    selectedContinent === "All"
      ? ["All", ...latest.map((d) => d.country).sort()]
      : [
          "All",
          ...latest
            .filter((d) => d.continent === selectedContinent)
            .map((d) => d.country)
            .sort(),
        ];

  // ========== METRICS ==========
  const totalCases = latest.reduce((s, d) => s + (d.total_cases || 0), 0);
  const totalDeaths = latest.reduce((s, d) => s + (d.total_deaths || 0), 0);
  const avgCfr = totalCases > 0 ? (totalDeaths / totalCases) * 100 : 0;

  // ========== CHART DATA ==========
  const topCases = [...filtered]
    .sort((a, b) => b.total_cases - a.total_cases)
    .slice(0, 12);
  const topDeaths = [...filtered]
    .sort((a, b) => b.total_deaths - a.total_deaths)
    .slice(0, 12);
  const topCasesPerMillion = [...filtered]
    .sort((a, b) => b.total_cases_per_million - a.total_cases_per_million)
    .slice(0, 12);
  const topDeathsPerMillion = [...filtered]
    .sort((a, b) => b.total_deaths_per_million - a.total_deaths_per_million)
    .slice(0, 12);
  const topCfr = [...filtered]
    .filter((d) => d.total_cases > 100000)
    .sort((a, b) => b.case_fatality_rate - a.case_fatality_rate)
    .slice(0, 12);
  const topVax = [...filtered]
    .filter((d) => d.population > 1000000 && d.fully_vaccinated_rate > 0)
    .sort((a, b) => b.fully_vaccinated_rate - a.fully_vaccinated_rate)
    .slice(0, 12);

  const selectedCountryData = selectedCountry !== "All" ? filtered[0] : null;

  // Yearly deaths
  let yearData = [...yearlyDeaths];
  if (selectedCountry !== "All") {
    yearData = yearData.filter((d) => d.country === selectedCountry);
  } else if (selectedContinent !== "All") {
    yearData = yearData.filter((d) => d.continent === selectedContinent);
  }

  const yearMap: Record<number, number> = {};
  yearData.forEach((d) => {
    yearMap[d.year] = (yearMap[d.year] || 0) + d.deaths;
  });

  const yearlyChartData = Object.entries(yearMap)
    .map(([year, deaths]) => ({
      year: Number(year),
      deaths,
    }))
    .sort((a, b) => a.year - b.year);

  // Scatter data
  const scatterCasesDeaths = filtered
    .filter((d) => d.total_cases > 1000 && d.total_deaths > 0)
    .slice(0, 100);

  const scatterCfrVax = filtered
    .filter((d) => d.case_fatality_rate > 0 && d.fully_vaccinated_rate > 1)
    .slice(0, 100);

  // Country vs Continent comparison
  let comparisonData: {
    name: string;
    country: number;
    continentAvg: number;
  }[] = [];

  if (selectedCountryData) {
    const continentCountries = latest.filter(
      (d) => d.continent === selectedCountryData.continent,
    );

    const avgCases =
      continentCountries.reduce((s, d) => s + d.total_cases, 0) /
      continentCountries.length;
    const avgDeaths =
      continentCountries.reduce((s, d) => s + d.total_deaths, 0) /
      continentCountries.length;
    const avgCfrCont =
      continentCountries.reduce((s, d) => s + d.case_fatality_rate, 0) /
      continentCountries.length;
    const avgVax =
      continentCountries.reduce((s, d) => s + d.fully_vaccinated_rate, 0) /
      continentCountries.length;

    comparisonData = [
      {
        name: "Cases",
        country: selectedCountryData.total_cases,
        continentAvg: Math.round(avgCases),
      },
      {
        name: "Deaths",
        country: selectedCountryData.total_deaths,
        continentAvg: Math.round(avgDeaths),
      },
      {
        name: "CFR %",
        country: Number(selectedCountryData.case_fatality_rate.toFixed(2)),
        continentAvg: Number(avgCfrCont.toFixed(2)),
      },
      {
        name: "Vaccinated %",
        country: Number(selectedCountryData.fully_vaccinated_rate.toFixed(1)),
        continentAvg: Number(avgVax.toFixed(1)),
      },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* SMART HEADER */}
      <header
        className={`border-b border-slate-700/30 bg-slate-900/60 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-500 ${
          showHeader
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-5">
          <h1 className="text-3xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight pb-1 tracking-tight">
            COVID-19 Data Tracking System
          </h1>

          <p className="text-center text-slate-400 mt-1.5 text-sm md:text-base tracking-wide">
            600,000+ records • 200+ countries • Interactive Dashboard
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <a
              href="#powerbi"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
            >
              View Power BI Report
            </a>

            <a
              href="https://app.powerbi.com/view?r=eyJrIjoiODhkZTk4OTYtYjhhMy00ZWRiLTgzZGItM2U3MzlkNWQ4MDI5IiwidCI6IjM0YmQ4YmVkLTJhYzEtNDFhZS05ZjA4LTRlMGEzZjExNzA2YyJ9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all duration-300 border border-slate-600/50 hover:border-slate-500 hover:-translate-y-0.5"
            >
              Open in New Tab ↗
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12 relative z-10">
        {/* KEY METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            {
              label: "Total Cases",
              value: totalCases.toLocaleString(),
              color: "from-blue-400 to-cyan-300",
              glow: "group-hover:shadow-blue-500/20",
            },
            {
              label: "Total Deaths",
              value: totalDeaths.toLocaleString(),
              color: "from-rose-400 to-orange-300",
              glow: "group-hover:shadow-rose-500/20",
            },
            {
              label: "Countries",
              value: latest.length,
              color: "from-emerald-400 to-teal-300",
              glow: "group-hover:shadow-emerald-500/20",
            },
            {
              label: "Global CFR",
              value: `${avgCfr.toFixed(2)}%`,
              color: "from-amber-400 to-yellow-300",
              glow: "group-hover:shadow-amber-500/20",
            },
          ].map((m, i) => (
            <div
              key={i}
              className={`group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/40 hover:border-slate-500/60 transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl ${m.glow}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <p className="text-slate-400 text-sm font-medium relative z-10">
                {m.label}
              </p>
              <p
                className={`text-2xl md:text-3xl font-bold mt-2 bg-gradient-to-r ${m.color} bg-clip-text text-transparent relative z-10`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/40 shadow-xl">
          <h2 className="text-lg font-semibold mb-5 text-cyan-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                Continent
              </label>
              <select
                value={selectedContinent}
                onChange={(e) => {
                  setSelectedContinent(e.target.value);
                  setSelectedCountry("All");
                }}
                className="w-full bg-slate-950/70 border border-slate-600/60 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
              >
                {continents.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-600/60 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COUNTRY SELECTED VIEW */}
        {selectedCountryData && (
          <>
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-xl shadow-cyan-500/5">
              <h2 className="text-xl font-semibold mb-5 text-cyan-300">
                {selectedCountryData.country} — Detailed View
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricBox
                  label="Total Cases"
                  value={selectedCountryData.total_cases.toLocaleString()}
                  color="text-blue-400"
                />
                <MetricBox
                  label="Total Deaths"
                  value={selectedCountryData.total_deaths.toLocaleString()}
                  color="text-rose-400"
                />
                <MetricBox
                  label="CFR"
                  value={`${selectedCountryData.case_fatality_rate.toFixed(2)}%`}
                  color="text-amber-400"
                />
                <MetricBox
                  label="Cases / Million"
                  value={Math.round(
                    selectedCountryData.total_cases_per_million,
                  ).toLocaleString()}
                  color="text-sky-400"
                />
                <MetricBox
                  label="Deaths / Million"
                  value={Math.round(
                    selectedCountryData.total_deaths_per_million,
                  ).toLocaleString()}
                  color="text-orange-400"
                />
                <MetricBox
                  label="Fully Vaccinated"
                  value={
                    selectedCountryData.fully_vaccinated_rate > 0
                      ? `${selectedCountryData.fully_vaccinated_rate.toFixed(1)}%`
                      : "N/A"
                  }
                  color="text-emerald-400"
                />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/40">
              <h2 className="text-lg font-semibold mb-4 text-violet-300">
                {selectedCountryData.country} vs {selectedCountryData.continent}{" "}
                Average
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => {
                        if (typeof value === "number")
                          return value.toLocaleString();
                        return value ?? "";
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="country"
                      name={selectedCountryData.country}
                      fill="#06b6d4"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="continentAvg"
                      name="Continent Avg"
                      fill="#64748b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* RANKINGS */}
        {selectedCountry === "All" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title={`Top Countries by Total Cases${
                  selectedContinent !== "All" ? ` (${selectedContinent})` : ""
                }`}
              >
                <HorizontalBar
                  data={topCases}
                  dataKey="total_cases"
                  fill="#3b82f6"
                />
              </ChartCard>

              <ChartCard
                title={`Top Countries by Total Deaths${
                  selectedContinent !== "All" ? ` (${selectedContinent})` : ""
                }`}
              >
                <HorizontalBar
                  data={topDeaths}
                  dataKey="total_deaths"
                  fill="#f97316"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top Countries by Cases per Million">
                <HorizontalBar
                  data={topCasesPerMillion}
                  dataKey="total_cases_per_million"
                  fill="#0ea5e9"
                />
              </ChartCard>

              <ChartCard title="Top Countries by Deaths per Million">
                <HorizontalBar
                  data={topDeathsPerMillion}
                  dataKey="total_deaths_per_million"
                  fill="#e11d48"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Case Fatality Rate (Countries > 100k cases)">
                <HorizontalBar
                  data={topCfr}
                  dataKey="case_fatality_rate"
                  fill="#ef4444"
                  isPercent
                />
              </ChartCard>

              <ChartCard title="Fully Vaccinated Rate (Pop > 1M)">
                <HorizontalBar
                  data={topVax}
                  dataKey="fully_vaccinated_rate"
                  fill="#10b981"
                  isPercent
                />
              </ChartCard>
            </div>
          </>
        )}

        {/* DEATHS BY YEAR */}
        {yearlyChartData.length > 0 && (
          <ChartCard
            title={`Deaths by Year${
              selectedCountry !== "All"
                ? ` — ${selectedCountry}`
                : selectedContinent !== "All"
                  ? ` — ${selectedContinent}`
                  : " — Global"
            }`}
          >
            <BarChart data={yearlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => {
                  if (typeof value === "number") return value.toLocaleString();
                  return value ?? "";
                }}
              />
              <Bar dataKey="deaths" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        )}

        {/* CONTINENT */}
        <ChartCard title="Continent-wise Cases & Deaths">
          <BarChart data={continentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="continent" tick={{ fill: "#94a3b8" }} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => {
                if (typeof value === "number") return value.toLocaleString();
                return value ?? "";
              }}
            />
            <Legend />
            <Bar
              dataKey="total_cases"
              fill="#3b82f6"
              name="Total Cases"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="total_deaths"
              fill="#f97316"
              name="Total Deaths"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        {/* GLOBAL TRENDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Global Daily New Cases">
            <LineChart data={globalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="new_cases"
                stroke="#38bdf8"
                strokeWidth={1}
                dot={false}
                opacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="new_cases_7day_avg"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ChartCard>

          <ChartCard title="Global Daily New Deaths">
            <LineChart data={globalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="new_deaths"
                stroke="#fb923c"
                strokeWidth={1}
                dot={false}
                opacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="new_deaths_7day_avg"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ChartCard>
        </div>

        {/* SCATTER PLOTS */}
        {selectedCountry === "All" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Cases vs Deaths">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="total_cases"
                  name="Cases"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="total_deaths"
                  name="Deaths"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={tooltipStyle}
                />
                <Scatter data={scatterCasesDeaths} fill="#8b5cf6" />
              </ScatterChart>
            </ChartCard>

            <ChartCard title="CFR vs Vaccination Rate">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="fully_vaccinated_rate"
                  name="Vaccination %"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="case_fatality_rate"
                  name="CFR %"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={tooltipStyle}
                />
                <Scatter data={scatterCfrVax} fill="#14b8a6" />
              </ScatterChart>
            </ChartCard>
          </div>
        )}

        {/* POWER BI REPORT */}
        <section
          id="powerbi"
          className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/40 shadow-xl"
        >
          <h2 className="text-xl font-semibold mb-2 text-cyan-300">
            Interactive Power BI Report
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            Explore the full interactive report with detailed pages: Overview,
            Country Rankings, Trends, Mortality & Vaccination, and Country Deep
            Dive.
          </p>

          <div className="w-full overflow-hidden rounded-xl border border-slate-700/60 shadow-inner">
            <iframe
              title="COVID-19 Tracking System - Power BI Report"
              src="https://app.powerbi.com/view?r=eyJrIjoiODhkZTk4OTYtYjhhMy00ZWRiLTgzZGItM2U3MzlkNWQ4MDI5IiwidCI6IjM0YmQ4YmVkLTJhYzEtNDFhZS05ZjA4LTRlMGEzZjExNzA2YyJ9"
              width="100%"
              height="620"
              frameBorder="0"
              allowFullScreen={true}
              className="w-full"
            />
          </div>
        </section>

        {/* INSIGHTS */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/40">
          <h2 className="text-lg font-semibold mb-5 text-violet-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            Key Insights
          </h2>
          <ul className="space-y-3.5 text-slate-300">
            {[
              "Multiple distinct global waves are clearly visible in the 7-day rolling averages.",
              "Case Fatality Rate varied widely due to age structure, healthcare capacity and vaccination.",
              "A small number of countries contributed a disproportionately large share of total cases and deaths.",
              "Higher vaccination coverage was generally associated with lower severity in later waves.",
              "Per-million metrics provide a much fairer comparison between countries than absolute numbers.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-cyan-400 mt-1.5 text-xs">▸</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-200 font-semibold text-lg">Tushar Pandey</p>
              <p className="text-slate-500 text-sm mt-1">
                COVID-19 Data Tracking System
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                { label: "GitHub", href: "https://github.com/tusharpandey9991" },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/tusharpandey30/" },
                { label: "Portfolio", href: "https://tushar-portfolio-lemon-eta.vercel.app/" },
                { label: "Email", href: "mailto:tushar2003oct30@gmail.com" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <p className="text-center text-slate-600 text-xs mt-8">
            Data Source: Our World in Data • Built with Next.js + TypeScript +
            Tailwind + Recharts + Power BI
          </p>
        </div>
      </footer>
    </div>
  );
}

// ========== HELPERS ==========
const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
};

function MetricBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors duration-300">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-lg font-bold mt-1.5 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/40 hover:border-slate-600/60 transition-all duration-500 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-slate-100">{title}</h2>
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HorizontalBar({
  data,
  dataKey,
  fill,
  isPercent = false,
}: {
  data: CountryData[];
  dataKey: keyof CountryData;
  fill: string;
  isPercent?: boolean;
}) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
      <YAxis
        type="category"
        dataKey="country"
        width={110}
        tick={{ fill: "#94a3b8", fontSize: 12 }}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value) => {
          if (typeof value === "number") {
            return isPercent ? `${value.toFixed(2)}%` : value.toLocaleString();
          }
          return value ?? "";
        }}
      />
      <Bar
        dataKey={dataKey as string}
        fill={fill}
        radius={[0, 6, 6, 0]}
        barSize={16}
      />
    </BarChart>
  );
}
