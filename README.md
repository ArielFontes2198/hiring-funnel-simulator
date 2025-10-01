# Hiring Funnel Simulator

A modern, interactive hiring funnel simulator that connects to Google Sheets and provides powerful simulation capabilities for recruitment planning.

## Features

### 🎯 **Core Functionality**
- **Google Sheets Integration** - Live data from your spreadsheet
- **Top-Down Simulation** - Calculate hires from starting candidates
- **Bottom-Up Simulation** - Calculate needed candidates from target hires
- **Stage Overrides** - Edit specific stage numbers with automatic recalculation
- **Multi-Pipeline Support** - Filter by Function, Level, Country, Source

### 🎨 **Design**
- **Nubank Branding** - Official color palette and modern design
- **Responsive Layout** - Works on desktop and mobile
- **Clean Interface** - Intuitive and easy to use
- **Real-time Updates** - Manual refresh from Google Sheets

### 📊 **Data Structure**
Your Google Sheet should have an "Inputs" tab with these columns:
- **Function** - Department (Engineering, Product, Design, etc.)
- **Level** - Seniority (Junior, Mid, Senior, etc.)
- **Country** - Location (Brazil, Mexico, etc.)
- **Source** - Recruitment channel (LinkedIn, Indeed, etc.)
- **Period** - Time period (Q4 2024, etc.)
- **Stage** - Funnel stage (Application, Phone Screen, etc.)
- **Order** - Sequential order (1, 2, 3, etc.)
- **PTR** - Pass-through rate (0.15, 0.25, etc.)

## Setup Instructions

### 1. **Google Apps Script Setup**
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the code from `apps-script/Code.gs`
4. Save the project
5. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Choose "Web app" as type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
6. Copy the web app URL

### 2. **Update App Configuration**
1. Open `src/App.tsx`
2. Find the line with `YOUR_SCRIPT_ID`
3. Replace with your Apps Script URL

### 3. **Google Sheet Setup**
1. Create a sheet with the required columns
2. Name the tab "Inputs"
3. Add your funnel data
4. Share the sheet with your Apps Script account

## Usage

### **Top-Down Simulation (Forward)**
1. Set simulation mode to "Top-Down"
2. Enter starting number of candidates
3. See how many people make it through each stage
4. Use overrides to adjust specific stages

### **Bottom-Up Simulation (Reverse)**
1. Set simulation mode to "Bottom-Up"
2. Enter target number of hires
3. See how many candidates you need at each stage
4. Use overrides to adjust specific stages

### **Stage Overrides**
- Click in the "Override" column for any stage
- Enter a specific number
- The rest of the funnel recalculates automatically
- Clear overrides with the "Clear Overrides" button

### **Filters**
- Use dropdowns to filter by Function, Level, Country, Source
- Results update automatically
- Shows pipeline information at the top

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This app is configured for GitHub Pages deployment:

1. Build the project: `npm run build`
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Set source to "GitHub Actions" or "Deploy from a branch"

## Color Palette

- **Primary**: #8A05BE (Purple)
- **Dark**: #5E0E9E (Dark Purple)
- **Success**: #16A34A (Green)
- **Danger**: #DC2626 (Red)
- **Text**: #0F172A (Dark Gray)
- **Muted Background**: #F5F5F7 (Light Gray)

## File Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Styling with Nubank colors
└── main.tsx         # Entry point

apps-script/
└── Code.gs          # Google Apps Script code
```

## API Response Format

The Apps Script returns data in this format:

```json
{
  "success": true,
  "rows": [
    {
      "Function": "Engineering",
      "Level": "Senior",
      "Country": "Brazil",
      "Source": "LinkedIn",
      "Period": "Q4 2024",
      "Stage": "Application",
      "Order": 1,
      "PTR": 0.15
    }
  ],
  "count": 6,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### **Data Not Loading**
- Check Apps Script URL is correct
- Verify Google Sheet sharing permissions
- Check browser console for errors

### **Simulation Not Working**
- Ensure all required columns are present
- Verify PTR values are between 0 and 1
- Check Order values are sequential

### **Styling Issues**
- Clear browser cache
- Check CSS file is loading
- Verify color variables are defined

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.