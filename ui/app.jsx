const { useState } = React;

const StepProgress = ({ steps, currentStep, onStepChange }) => {
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      onStepChange(Math.min(index + 1, steps.length - 1));
    } else if (e.key === 'ArrowLeft') {
      onStepChange(Math.max(index - 1, 0));
    }
  };
  return (
    <nav className="steps" aria-label="Progress steps">
      {steps.map((step, idx) => (
        <button
          key={step}
          className={`step ${idx === currentStep ? 'active' : ''}`}
          aria-current={idx === currentStep ? 'step' : undefined}
          aria-label={`Step ${idx + 1}: ${step}`}
          onClick={() => onStepChange(idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
        >
          {idx + 1}. {step}
        </button>
      ))}
    </nav>
  );
};

const ControlPanel = () => (
  <div className="controls" role="region" aria-label="Controls">
    <button className="btn" aria-label="Add row">Add</button>
    <button className="btn" aria-label="Remove selected">Remove</button>
  </div>
);

const DataTable = ({ columns, data }) => (
  <div className="table-wrapper">
    <table className="data-table" role="table" aria-label="Player data">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} scope="col">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const App = () => {
  const steps = ['Upload', 'Confirm', 'Contest', 'Optimize'];
  const [currentStep, setCurrentStep] = useState(0);
  const columns = ['Player', 'Team', 'Salary'];
  const data = [
    { Player: 'John Doe', Team: 'ABC', Salary: 5000 },
    { Player: 'Jane Roe', Team: 'XYZ', Salary: 4800 },
  ];
  return (
    <div className="app">
      <StepProgress steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
      <ControlPanel />
      <DataTable columns={columns} data={data} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
