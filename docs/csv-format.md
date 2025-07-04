# 📊 CSV Format - Modern CamelCase

## 🎯 Overview

This project uses a modern camelCase format for CSV files to ensure better AI compatibility and modern development practices.

## 📋 Column Structure

| **Column Name** | **Type** | **Description** |
|-----------------|----------|-----------------|
| `keywords` | Text | Project keywords/description |
| `functionalAssigned` | Text | Functional consultant assigned |
| `abapAssigned` | Text | ABAP developer assigned |
| `effortReceivedPlan` | Number | Planned effort in hours |
| `effortReceivedReal` | Number | Actual effort in hours |
| `effortReadyDate` | Date | Date when effort is ready |
| `effortExecutionStart` | Date | Start date of execution |
| `plannedAbapDevStart` | Date | Planned ABAP development start |
| `plannedAbapDevEnd` | Date | Planned ABAP development end |
| `actualAbapDevStart` | Date | Actual ABAP development start |
| `actualAbapDevEnd` | Date | Actual ABAP development end |
| `plannedCpiDevStart` | Date | Planned CPI development start |
| `plannedCpiDevEnd` | Date | Planned CPI development end |
| `abapDevelopmentTime` | Number | ABAP development time in hours |
| `abapTestTime` | Number | ABAP test time in hours |
| `cpiDevelopmentTime` | Number | CPI development time in hours |
| `cpiTestTime` | Number | CPI test time in hours |
| `plannedAbapDevelopmentTime` | Number | Planned ABAP development time |

## 📁 Example CSV

```csv
keywords,functionalAssigned,abapAssigned,effortReceivedPlan,effortReceivedReal,effortReadyDate,effortExecutionStart,plannedAbapDevStart,plannedAbapDevEnd,actualAbapDevStart,actualAbapDevEnd,plannedCpiDevStart,plannedCpiDevEnd,abapDevelopmentTime,abapTestTime,cpiDevelopmentTime,cpiTestTime,plannedAbapDevelopmentTime
"Desarrollo módulo FI","Juan Pérez","María García",40,38,"2024-01-15","2024-01-20","2024-01-20","2024-02-15","2024-01-22","2024-02-18","2024-02-20","2024-03-10",20,8,10,5,18
```

## 🔧 Usage in Code

```typescript
import { CSV_COLUMNS, processCSV } from './lib/csv-processor';

// Process CSV file
const result = processCSV(csvContent);

// Access data with type safety
const row = result.data[0];
console.log(row.keywords); // "Desarrollo módulo FI"
console.log(row.abapDevelopmentTime); // 20
console.log(row.abapTestTime); // 8
console.log(row.cpiTestTime); // 5
```

## ✅ Benefits

- **AI-Friendly**: camelCase is more natural for AI processing
- **Type Safety**: Full TypeScript support
- **Performance**: Direct property access
- **Maintainability**: Clean, readable code
- **Consistency**: Modern JavaScript conventions
- **Simplified**: Focused on development and testing times

## 🚀 Getting Started

1. **Update your CSV files** to use camelCase column names
2. **Use the provided functions** for processing
3. **Enjoy type safety** and better performance

See `examples/csv-example.csv` for a complete example. 