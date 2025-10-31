# Gas Indicators Feature - At-a-Glance Gas Coverage

## Overview

Visual indicators showing which gas types have isolation valves at each location (building/floor/zone). See instantly if O₂, Medical Air, and Vacuum are covered.

## Visual Design

### Gas Icons

**Oxygen (O₂)** 🟢
- Icon: Droplet
- Color: Green
- Critical for patient care

**Medical Air** 🔵
- Icon: Wind  
- Color: Blue
- Essential for respiratory support

**Vacuum** 🟣
- Icon: Zap
- Color: Purple
- Required for suction systems

### States

**Present** (Colored & Opaque):
```
🟢 🔵 🟣  ← All three gases covered
```

**Missing** (Gray & Faded):
```
⚪ ⚪ ⚪  ← No valves yet
```

**Partial Coverage**:
```
🟢 ⚪ 🟣  ← Has O₂ and Vacuum, missing Air
```

## UI Integration

### Building Level
```
┌─────────────────────────────────────────────┐
│ 🏢 Main Building                [🛡️ 3] 🟢🔵🟣 │
│    4 floors                                  │
└─────────────────────────────────────────────┘
```
**Interpretation**: Building has 3 valves covering all 3 primary gases

### Floor Level
```
┌─────────────────────────────────────────────┐
│   📚 Floor 2 - ICU            [🛡️ 2] 🟢⚪🟣  │
│      (3 zones)                               │
└─────────────────────────────────────────────┘
```
**Interpretation**: Floor has 2 valves, covering O₂ and Vacuum, but missing Medical Air

### Zone Level
```
┌─────────────────────────────────────────────┐
│     📦 ICU-203               [🛡️ 1] 🟢⚪⚪   │
└─────────────────────────────────────────────┘
```
**Interpretation**: Zone has 1 valve for Oxygen only

## Smart Benefits

### Instant Visual Audit
- **One glance** shows gas coverage
- **No clicking** required
- **Color-coded** for quick recognition

### Gap Identification
```
Building A:  🟢🔵🟣  ✓ Complete
Building B:  🟢⚪🟣  ⚠️ Missing Air
Building C:  ⚪⚪⚪  ❌ No valves
```

### Compliance Checking
- Verify all critical areas have O₂
- Ensure ICU zones have all three gases
- Identify locations needing additional valves

### Planning Support
- See which gases need valves
- Prioritize installations
- Track coverage improvements

## Use Cases

### 1. New Site Setup
**Goal**: Ensure complete gas coverage

**Workflow**:
1. Create building structure
2. Add valves for each gas type
3. Watch indicators turn from gray → colored
4. Verify all locations show 🟢🔵🟣

### 2. Safety Audit
**Goal**: Verify critical areas have required gases

**Checklist**:
- [ ] All ICU zones have O₂ (🟢)
- [ ] Operating rooms have all three (🟢🔵🟣)
- [ ] Emergency areas have O₂ and Vacuum (🟢🟣)

### 3. Maintenance Planning
**Goal**: Identify missing valves

**Process**:
1. Scan hierarchy for gray indicators
2. Note locations with incomplete coverage
3. Plan valve installations
4. Track progress as indicators turn colored

### 4. Compliance Reporting
**Goal**: Generate coverage report

**Data Points**:
- Buildings with complete coverage: Count 🟢🔵🟣
- Locations missing O₂: Count ⚪ in first position
- Total coverage percentage

## Technical Implementation

### Data Flow

**On Page Load**:
```
1. Fetch all valve nodes
2. Fetch valve details (includes gasType)
3. Group by location (building/floor/zone)
4. Extract unique gas types per location
5. Display indicators
```

### Hook API

```typescript
const { locationGases } = useValveData(organizationId);

// locationGases: Map<locationId, GasType[]>
// Example: Map { 
//   "building-123": ["oxygen", "medical_air"],
//   "floor-456": ["oxygen", "vacuum"]
// }
```

### Component Usage

```typescript
<GasIndicators 
  gases={locationGases.get(building.id) || []} 
  size="md" 
/>
```

### Gas Types Supported

Primary (Always Shown):
- `oxygen` - O₂
- `medical_air` - Medical Air
- `vacuum` - Vacuum

Additional (Future):
- `nitrous_oxide` - N₂O
- `nitrogen` - N₂
- `carbon_dioxide` - CO₂

## Visual Examples

### Complete Hospital Floor
```
Floor 3 - Surgery Wing              [🛡️ 12] 🟢🔵🟣
├─ OR-301                           [🛡️ 3]  🟢🔵🟣
├─ OR-302                           [🛡️ 3]  🟢🔵🟣
├─ OR-303                           [🛡️ 3]  🟢🔵🟣
└─ Recovery Room                    [🛡️ 3]  🟢🔵🟣
```
**Status**: ✅ Fully compliant - All zones have complete gas coverage

### Partial Coverage
```
Floor 2 - General Ward              [🛡️ 6]  🟢🔵⚪
├─ Room 201-205                     [🛡️ 2]  🟢🔵⚪
├─ Room 206-210                     [🛡️ 2]  🟢🔵⚪
└─ Nurse Station                    [🛡️ 2]  🟢🔵⚪
```
**Status**: ⚠️ Missing vacuum - Need to add vacuum valves

### New Building (No Valves)
```
Building C - New Wing               [🛡️ 0]  ⚪⚪⚪
├─ Floor 1                          [🛡️ 0]  ⚪⚪⚪
│  └─ Zone C-101                    [🛡️ 0]  ⚪⚪⚪
└─ Floor 2                          [🛡️ 0]  ⚪⚪⚪
   └─ Zone C-201                    [🛡️ 0]  ⚪⚪⚪
```
**Status**: ❌ No valves installed - Needs complete setup

## User Workflows

### Scenario 1: Quick Coverage Check
```
User: "Does Building A have all gases?"
Action: Look at building row
Result: See 🟢🔵🟣 → Yes, complete
Time: < 1 second
```

### Scenario 2: Find Missing Gases
```
User: "Which floors need Medical Air?"
Action: Scan for ⚪ in middle position
Result: Floor 2, Floor 5 identified
Time: < 5 seconds
```

### Scenario 3: Verify New Installation
```
User: "Did the new O₂ valve get added?"
Action: Check zone indicators
Before: ⚪⚪⚪
After:  🟢⚪⚪
Result: ✓ Confirmed
```

## Accessibility

### Tooltips
Hover over each indicator:
- 🟢 → "Oxygen valve present"
- ⚪ → "No Oxygen valve"

### Color + Icon
Not relying on color alone:
- Different icons per gas type
- Opacity change (faded vs solid)
- Works for colorblind users

### Keyboard Navigation
- Tab through locations
- Indicators visible in focus state
- Screen reader announces gas coverage

## Future Enhancements

### Expandable Gas List
Click indicator to see valve details:
```
🟢 Oxygen
  ├─ Main Building - O₂ Valve (open)
  └─ Floor 2 - O₂ Isolation (open)
```

### Coverage Percentage
```
Building A: 🟢🔵🟣 100%
Building B: 🟢⚪🟣  67%
Building C: ⚪⚪⚪   0%
```

### Filtering
"Show only locations missing Medical Air"
→ Highlights rows with ⚪ in middle position

### Alerts
⚠️ "ICU Zone missing Oxygen valve"
→ Critical safety notification

### Reports
Generate PDF showing:
- Coverage by building
- Missing gases list
- Compliance status

## Best Practices

### For Administrators
1. **Check indicators daily** for any gray icons in critical areas
2. **Prioritize O₂** - Ensure all patient areas have 🟢
3. **Document gaps** - Note locations with incomplete coverage
4. **Track improvements** - Watch indicators turn colored over time

### For Maintenance Teams
1. **Use as checklist** - Verify all indicators are colored
2. **Report issues** - Note any unexpected gray indicators
3. **Plan installations** - Focus on locations with most gray icons
4. **Verify work** - Check indicators after valve installation

### For Safety Officers
1. **Audit regularly** - Scan for incomplete coverage
2. **Enforce standards** - Require 🟢🔵🟣 in critical zones
3. **Generate reports** - Use indicators for compliance documentation
4. **Train staff** - Teach team to read indicators

## Summary

The gas indicators provide:

✅ **Instant visibility** - See gas coverage at a glance
✅ **Smart design** - Color + icon for accessibility  
✅ **Gap identification** - Quickly spot missing gases
✅ **No interaction needed** - Information always visible
✅ **Scales well** - Works for 1 or 100 buildings
✅ **Actionable** - Clear what needs to be added

**Result**: Safer facilities with better gas coverage oversight! 🏥
