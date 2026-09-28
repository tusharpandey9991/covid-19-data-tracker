# COVID-19 Data Tracking System

A comprehensive data analysis project that processes and analyzes 600,000+ COVID-19 records across 200+ countries to uncover infection trends, mortality patterns, vaccination progress, and key public-health insights.

---

## Project Highlights

- Processed and analyzed **600,000+** COVID-19 records spanning **200+ countries**
- Applied **Python, Pandas, and NumPy** for data cleaning, transformation, aggregation, and exploratory data analysis
- Built **15+ analytical visualizations** and WordCloud reports covering:
  - Global infection & mortality trends
  - Country-level and continent-level comparisons
  - Case Fatality Rate analysis
  - Vaccination coverage
  - Correlation analysis
- Generated clear, decision-oriented insights on outbreak progression, preventive measures, and healthcare resource needs

---

## Dataset

**Source**: Our World in Data (OWID) – Compact COVID-19 Dataset  
**Records**: ~617,000 rows  
**Time Period**: Early 2020 – latest available data  
**Key Metrics**: Confirmed cases, deaths, vaccinations, testing, hospital/ICU patients, stringency index, demographic indicators

---

## Project Structure

covid19-data-tracking-system/
├── data/
│ ├── raw/ # Original dataset
│ └── processed/ # Cleaned & feature-engineered data
├── notebooks/
│ ├── 01_data_acquisition.ipynb
│ ├── 02_data_cleaning_eda.ipynb
│ ├── 03_visualizations.ipynb
│ └── 04_insights_and_summary.ipynb
├── src/ # Reusable Python modules
├── reports/ # All generated charts and summary tables
├── requirements.txt
└── README.md
text

## Key Insights

- The pandemic exhibited multiple distinct global waves, clearly visible through 7-day rolling averages.
- Case Fatality Rate varied significantly by country, influenced by age structure, healthcare capacity, and vaccination rates.
- A small number of countries contributed a disproportionately large share of total cases and deaths.
- High vaccination coverage was associated with reduced severity in later waves.
- Absolute numbers can be misleading — per-million metrics provide fairer international comparisons.

## Technologies Used

- **Python**
- **Pandas** & **NumPy**
- **Matplotlib** & **Seaborn**
- **WordCloud**
- **Jupyter Notebooks**
- **VS Code**

## How to Run This Project

1. Clone the repository
2. Create a virtual environment:

   ```bash
   python -m venv venv

## Author

Tushar Pandey
