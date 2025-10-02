import { useState, useEffect } from 'react'
import './App.css'

// Types
interface FunnelData {
  Function: string
  Level: string
  Country: string
  Source: string
  Period: string
  Stage: string
  Order: number
  PTR: number
}

interface StageResult {
  stage: string
  order: number
  ptr: number
  candidates: number
  result: number
  isOverride: boolean
}

function App() {
  const [activeTab, setActiveTab] = useState('simulator')
  const [data, setData] = useState<FunnelData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Filter states
  const [filters, setFilters] = useState({
    function: '',
    level: '',
    country: '',
    source: ''
  })

  // Simulation states
  const [simulationMode, setSimulationMode] = useState<'top-down' | 'bottom-up'>('top-down')
  const [startingCandidates, setStartingCandidates] = useState(1000)
  const [targetHires, setTargetHires] = useState(10)
  const [stageOverrides, setStageOverrides] = useState<Record<string, number>>({})

  // Load data from Google Sheets
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // For now, using mock data. Replace with actual Apps Script URL
      const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec')
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.rows)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      console.warn('Using mock data:', err)
      // Mock data for development
      const mockData: FunnelData[] = [
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Application', Order: 1, PTR: 0.15 },
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Phone Screen', Order: 2, PTR: 0.25 },
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Technical Interview', Order: 3, PTR: 0.40 },
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Final Interview', Order: 4, PTR: 0.60 },
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Offer', Order: 5, PTR: 0.80 },
        { Function: 'Engineering', Level: 'Senior', Country: 'Brazil', Source: 'LinkedIn', Period: 'Q4 2024', Stage: 'Hired', Order: 6, PTR: 1.00 },
        
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Application', Order: 1, PTR: 0.20 },
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Phone Screen', Order: 2, PTR: 0.30 },
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Technical Interview', Order: 3, PTR: 0.50 },
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Final Interview', Order: 4, PTR: 0.70 },
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Offer', Order: 5, PTR: 0.85 },
        { Function: 'Product', Level: 'Mid', Country: 'Brazil', Source: 'Indeed', Period: 'Q4 2024', Stage: 'Hired', Order: 6, PTR: 1.00 }
      ]
      
      setData(mockData)
      setLastUpdated(new Date())
      setError('Using sample data (Apps Script not configured)')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Get unique values for filters (with cascading logic)
  const getUniqueValues = (field: keyof FunnelData) => {
    // Start with all data
    let filteredForField = data
    
    // Apply cascading filters based on field
    if (field === 'Level') {
      // For Level, filter by selected Function
      if (filters.function) {
        filteredForField = data.filter(item => item.Function === filters.function)
      }
    } else if (field === 'Country') {
      // For Country, filter by selected Function and Level
      filteredForField = data.filter(item => {
        if (filters.function && item.Function !== filters.function) return false
        if (filters.level && item.Level !== filters.level) return false
        return true
      })
    } else if (field === 'Source') {
      // For Source, filter by selected Function, Level, and Country
      filteredForField = data.filter(item => {
        if (filters.function && item.Function !== filters.function) return false
        if (filters.level && item.Level !== filters.level) return false
        if (filters.country && item.Country !== filters.country) return false
        return true
      })
    }
    
    const values = Array.from(new Set(filteredForField.map(item => item[field])))
    return values.sort()
  }

  // Filter data based on current filters
  const filteredData = data.filter(item =>
    (filters.function === '' || item.Function === filters.function) &&
    (filters.level === '' || item.Level === filters.level) &&
    (filters.country === '' || item.Country === filters.country) &&
    (filters.source === '' || item.Source === filters.source)
  ).sort((a, b) => a.Order - b.Order)

  // Calculate simulation results
  const calculateResults = (): StageResult[] => {
    if (filteredData.length === 0) return []

    // Get unique stages (remove duplicates by order)
    const uniqueStages = filteredData.reduce((acc, item) => {
      if (!acc.find(s => s.order === item.Order)) {
        acc.push({
          stage: item.Stage,
          order: item.Order,
          ptr: item.PTR
        })
      }
      return acc
    }, [] as { stage: string; order: number; ptr: number }[])

    // Sort by order
    uniqueStages.sort((a, b) => a.order - b.order)

    if (simulationMode === 'top-down') {
      // Top-down: Start with initial candidates and calculate forward
      const results: StageResult[] = []
      let currentCandidates = startingCandidates
      
      for (let i = 0; i < uniqueStages.length; i++) {
        const stage = uniqueStages[i]
        const overrideKey = `${stage.order}-${stage.stage}`
        const hasOverride = stageOverrides[overrideKey] !== undefined
        
        if (hasOverride) {
          const overrideValue = stageOverrides[overrideKey]!
          results.push({
            stage: stage.stage,
            order: stage.order,
            ptr: stage.ptr,
            candidates: currentCandidates,
            result: overrideValue,
            isOverride: true
          })
          currentCandidates = overrideValue // Next stage starts with this result
        } else {
          const result = Math.round(currentCandidates * stage.ptr)
          results.push({
            stage: stage.stage,
            order: stage.order,
            ptr: stage.ptr,
            candidates: currentCandidates,
            result: result,
            isOverride: false
          })
          currentCandidates = result // Next stage starts with this result
        }
      }
      
      return results
    } else {
      // Bottom-up: Start with target hires and calculate forwards from the override point
      const results: StageResult[] = []
      
      // Initialize all results with baseline calculation
      let currentTarget = targetHires
      for (let i = uniqueStages.length - 1; i >= 0; i--) {
        const stage = uniqueStages[i]
        const neededCandidates = Math.round(currentTarget / stage.ptr)
        results.unshift({
          stage: stage.stage,
          order: stage.order,
          ptr: stage.ptr,
          candidates: neededCandidates,
          result: currentTarget,
          isOverride: false
        })
        currentTarget = neededCandidates
      }
      
      // Find the earliest override and recalculate from there forward
      let earliestOverrideIndex = -1
      let earliestOverrideValue = 0
      
      for (let i = 0; i < uniqueStages.length; i++) {
        const stage = uniqueStages[i]
        const overrideKey = `${stage.order}-${stage.stage}`
        const hasOverride = stageOverrides[overrideKey] !== undefined
        
        if (hasOverride && earliestOverrideIndex === -1) {
          earliestOverrideIndex = i
          earliestOverrideValue = stageOverrides[overrideKey]!
        }
      }
      
      // If we have an override, recalculate from that point forward
      if (earliestOverrideIndex !== -1) {
        // Apply the override
        results[earliestOverrideIndex] = {
          ...results[earliestOverrideIndex],
          candidates: earliestOverrideValue,
          isOverride: true
        }
        
        // Calculate forward from the override point
        let currentCandidates = earliestOverrideValue
        
        for (let i = earliestOverrideIndex + 1; i < uniqueStages.length; i++) {
          const stage = uniqueStages[i]
          const overrideKey = `${stage.order}-${stage.stage}`
          const hasOverride = stageOverrides[overrideKey] !== undefined
          
          if (hasOverride) {
            const overrideValue = stageOverrides[overrideKey]!
            results[i] = {
              ...results[i],
              candidates: currentCandidates,
              result: overrideValue,
              isOverride: true
            }
            currentCandidates = overrideValue
          } else {
            const result = Math.round(currentCandidates * stage.ptr)
            results[i] = {
              ...results[i],
              candidates: currentCandidates,
              result: result,
              isOverride: false
            }
            currentCandidates = result
          }
        }
      }
      
      return results
    }
  }

  const results = calculateResults()

  // Get pipeline info
  const getPipelineInfo = () => {
    if (filteredData.length === 0) return { period: 'N/A', function: 'N/A', level: 'N/A', country: 'N/A', source: 'N/A' }
    
    const first = filteredData[0]
    return {
      period: first.Period,
      function: first.Function,
      level: first.Level,
      country: first.Country,
      source: first.Source
    }
  }

  const pipelineInfo = getPipelineInfo()

  // Handle stage override
  const handleStageOverride = (stageKey: string, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value)
    if (numValue === undefined) {
      const newOverrides = { ...stageOverrides }
      delete newOverrides[stageKey]
      setStageOverrides(newOverrides)
    } else {
      setStageOverrides({ ...stageOverrides, [stageKey]: numValue })
    }
  }

  // Clear all overrides
  const clearOverrides = () => {
    setStageOverrides({})
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      function: '',
      level: '',
      country: '',
      source: ''
    })
  }

  // Handle filter changes with cascading logic
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    
    // Clear dependent filters when parent filter changes
    if (field === 'function') {
      newFilters.level = ''
      newFilters.country = ''
      newFilters.source = ''
    } else if (field === 'level') {
      newFilters.country = ''
      newFilters.source = ''
    } else if (field === 'country') {
      newFilters.source = ''
    }
    
    setFilters(newFilters)
  }

  // Handle simulation mode change
  const handleSimulationModeChange = (mode: 'top-down' | 'bottom-up') => {
    setSimulationMode(mode)
    // Clear overrides when changing mode to avoid conflicts
    setStageOverrides({})
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-placeholder">🏦</div>
            <h1 className="title">Hiring Funnel Simulator</h1>
          </div>
          
          <div className="header-actions">
            <button 
              className={`refresh-btn ${loading ? 'loading' : ''}`}
              onClick={loadData}
              disabled={loading}
            >
              {loading ? '🔄' : '🔄'} Refresh
            </button>
            
            <nav className="nav">
              <button 
                className={activeTab === 'simulator' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveTab('simulator')}
              >
                Simulator
              </button>
              <button 
                className={activeTab === 'inputs' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveTab('inputs')}
              >
                Inputs
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading data from Google Sheets...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}

        {!loading && activeTab === 'simulator' && (
          <div className="simulator">
            <div className="simulator-header">
              <h2>Hiring Funnel Simulator</h2>
              <div className="pipeline-info">
                <span><strong>Period:</strong> {pipelineInfo.period}</span>
                <span><strong>Function:</strong> {pipelineInfo.function}</span>
                <span><strong>Level:</strong> {pipelineInfo.level}</span>
                <span><strong>Country:</strong> {pipelineInfo.country}</span>
                <span><strong>Source:</strong> {pipelineInfo.source}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="filters">
              <div className="filters-row">
                <select 
                  value={filters.function} 
                  onChange={(e) => handleFilterChange('function', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Select Function</option>
                  {getUniqueValues('Function').map(func => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.level} 
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="filter-select"
                  disabled={!filters.function}
                >
                  <option value="">{filters.function ? 'Select Level' : 'Select Function first'}</option>
                  {getUniqueValues('Level').map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.country} 
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="filter-select"
                  disabled={!filters.function || !filters.level}
                >
                  <option value="">{filters.function && filters.level ? 'Select Country' : 'Select Function & Level first'}</option>
                  {getUniqueValues('Country').map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.source} 
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="filter-select"
                  disabled={!filters.function || !filters.level || !filters.country}
                >
                  <option value="">{filters.function && filters.level && filters.country ? 'Select Source' : 'Select previous filters first'}</option>
                  {getUniqueValues('Source').map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="controls">
              <div className="control-group">
                <label>Simulation Mode:</label>
                <select 
                  value={simulationMode} 
                  onChange={(e) => handleSimulationModeChange(e.target.value as 'top-down' | 'bottom-up')}
                  className="control-select"
                >
                  <option value="top-down">Top-Down (Forward)</option>
                  <option value="bottom-up">Bottom-Up (Reverse)</option>
                </select>
              </div>

              {simulationMode === 'top-down' ? (
                <div className="control-group">
                  <label>Starting Candidates:</label>
                  <input
                    type="number"
                    value={startingCandidates}
                    onChange={(e) => setStartingCandidates(parseInt(e.target.value) || 0)}
                    className="control-input"
                  />
                </div>
              ) : (
                <div className="control-group">
                  <label>Target Hires:</label>
                  <input
                    type="number"
                    value={targetHires}
                    onChange={(e) => setTargetHires(parseInt(e.target.value) || 0)}
                    className="control-input"
                  />
                </div>
              )}

              <div className="control-group">
                <button onClick={clearOverrides} className="clear-btn">
                  Clear Overrides
                </button>
              </div>
            </div>

            {/* Results Table */}
            {filteredData.length === 0 && data.length > 0 ? (
              <div className="no-data">
                <div className="no-data-icon">📊</div>
                <h3>No Data Available</h3>
                <p>No funnel data found for the selected filter combination.</p>
                <p>Try adjusting your filters or click "Clear Filters" to see all available data.</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Stage</th>
                      <th>PTR (%)</th>
                      <th>Candidates</th>
                      <th>Result</th>
                      <th>Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((stage, index) => {
                      const stageKey = `${stage.order}-${stage.stage}`
                      const overrideValue = stageOverrides[stageKey]
                      
                      return (
                        <tr key={stageKey} className={stage.isOverride ? 'override-row' : ''}>
                          <td>{stage.order}</td>
                          <td>{stage.stage}</td>
                          <td>{(stage.ptr * 100).toFixed(0)}%</td>
                          <td>{stage.candidates}</td>
                          <td className="result-cell">{stage.result}</td>
                          <td>
                            <input
                              type="number"
                              placeholder="Override"
                              value={overrideValue || ''}
                              onChange={(e) => handleStageOverride(stageKey, e.target.value)}
                              className="override-input"
                              title={overrideValue ? `Override: ${overrideValue}` : 'Click to override this stage'}
                            />
                            {overrideValue && (
                              <div style={{ 
                                fontSize: '10px', 
                                color: 'var(--primary)', 
                                fontWeight: 'bold', 
                                marginTop: '2px',
                                backgroundColor: 'rgba(138, 5, 190, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                OVERRIDE
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">⚠️</div>
                <h3>No Results</h3>
                <p>Unable to calculate simulation results for the current data.</p>
                <p>Please check your simulation parameters or try different filters.</p>
              </div>
            )}

            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'inputs' && (
          <div className="inputs">
            <h2>Raw Data from Google Sheets</h2>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Level</th>
                    <th>Country</th>
                    <th>Source</th>
                    <th>Period</th>
                    <th>Stage</th>
                    <th>Order</th>
                    <th>PTR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td>{item.Function}</td>
                      <td>{item.Level}</td>
                      <td>{item.Country}</td>
                      <td>{item.Source}</td>
                      <td>{item.Period}</td>
                      <td>{item.Stage}</td>
                      <td>{item.Order}</td>
                      <td>{(item.PTR * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App