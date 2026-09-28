export interface CountryData {
  country: string;
  continent: string;
  code: string;
  total_cases: number;
  total_deaths: number;
  total_cases_per_million: number;
  total_deaths_per_million: number;
  case_fatality_rate: number;
  fully_vaccinated_rate: number;
  population: number;
  median_age: number;
  gdp_per_capita: number;
  life_expectancy: number;
}

export interface GlobalTrend {
  date: string;
  new_cases: number;
  new_deaths: number;
  new_cases_7day_avg: number;
  new_deaths_7day_avg: number;
}

export interface ContinentSummary {
  continent: string;
  total_cases: number;
  total_deaths: number;
  population: number;
}

export interface YearlyDeaths {
  country: string;
  continent: string;
  year: number;
  deaths: number;
}
