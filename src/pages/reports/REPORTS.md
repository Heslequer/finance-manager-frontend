# Visual and Functional Guide: Reports Page

This document describes the structure, layout, controls, and charts of the **Reports Page** in the Finance Manager Frontend application, located at [reports.tsx](file:///c:/Users/hesle/OneDrive/Documentos/finance-manager/finance-manager-frontend/src/pages/reports/reports.tsx).

---

## 1. Overview and Layout Structure

The Reports Page provides a comprehensive view of the user's financial status, including total income, expenses, balance, cash flow trends over time, category rankings, and category/subcategory distribution breakdowns.

The UI consists of:
1. **Sidebar Navigation**: Left-hand navigation panel allowing the user to navigate to other pages (e.g., Reports, Categories).
2. **Page Header**: Located at the top, displaying the page title ("Financial Reports") and a short description.
3. **Filter Panel (Date & Categories)**: A control card containing filters for Date Period, Date Range, Transaction Type, and Category/Subcategory trees.
4. **Summary Cards**: Three metric cards showing Total Balance, Incomes, and Expenses.
5. **Charts Section**: Contains a natural line chart for cash flow trends, a category ranking table, and flexible toggleable charts for expenses and incomes.

---

## 2. Filter Control Panel

The filters allow users to narrow down the transactions displayed in the charts and summaries.

| Filter Element | Type | Options / Behavior |
| :--- | :--- | :--- |
| **Quick Filter Period** | Dropdown (`Select`) | `Last 30 Days`, `Last Week`, `Last Month`, `Last 3 Months`, `Custom` |
| **Date Range** | Date Range Picker (`RangePicker`) | Enabled only when the Quick Filter Period is set to `Custom`. Allows selecting a start and end date. |
| **Transaction Type** | Dropdown (`Select`) | `All`, `Expense`, `Income`. Changing this resets category selections. |
| **Select a Category or Subcategory** | Hierarchical Checkboxes (`TreeSelect`) | Multi-select tree listing all active Categories and their child Subcategories. Displays selected items hierarchically. |
| **Clear Filters** | Button | Resets all filters, clearing any applied search criteria and updating charts. |
| **Apply Filters** | Button | Triggers backend data loading and calculations for all filtered values. |

---

## 3. Top Summary Metrics Cards

These cards provide a quick, high-level overview of the calculated financial totals based on the active filters.

*   **Total Balance**:
    *   **Formula**: `Total Incomes - Total Expenses`
    *   **Visual Indicator**: Colored green if the balance is positive or equal to zero (e.g., `R$ 1.500,00`), and red if it is negative. Shows `R$ 0,00` if filters are not applied.
*   **Incomes**:
    *   **Description**: Sum of all filtered income transactions.
    *   **Visual Indicator**: Always colored green.
*   **Expenses**:
    *   **Description**: Sum of all filtered expense transactions.
    *   **Visual Indicator**: Always colored red.

---

## 4. Charts and Visualizations

The page utilizes `@mui/x-charts` for rendering visualizations.

### A. Line Chart (Balance and Cash Flow Over Time)
*   **Visual Type**: Natural curved multi-line chart (`LineChart`).
*   **Data Series**:
    1.  **Incomes (Green Line)**: Shows the trend of incoming funds over time.
    2.  **Expenses (Red Line)**: Shows the trend of outgoing funds over time.
*   **Controls**: Timeframe selector dropdown (`Day`, `Week`, `Month`) to group data chronologically on the X-axis.
*   **User Information**: Helps the user visualize and compare their cash flow trends, identifying peak earning or spending periods.

### B. Ranking of Expenses and Incomes
*   **Visual Type**: Vertical list breakdown with progress indicators (Ant Design `Progress` bars).
*   **Information Shown**:
    *   **Category Name**: Displays the parent category.
    *   **Transaction Count**: Total number of transactions recorded for that category.
    *   **Amount in R$**: Highlighted in green for income categories and red for expense categories.
    *   **Progress Bar & Percentage**: A colored bar (`Progress`) representing the percentage share of the category relative to total incomes or total expenses, colored dynamically using the category's configured color.
*   **Sorting**: Automatically sorted descending by monetary amount, showing the most significant categories first.

### C. Flexible Expenses Charts
*   **Visual Type**: Toggleable chart. Users can switch chart representations using a dropdown selector.
*   **Chart Options**:
    1.  **Categories - Bar Chart**:
        *   *X-Axis*: Parent expense category names.
        *   *Y-Axis*: Sum of expense amounts in R$.
        *   *Colors*: Unique custom colors mapped to each category's database configuration.
    2.  **Categories - Pie Chart**:
        *   *Visual*: Slices representing parent categories.
        *   *Labels*: Shows category name and percentage of total expenses.
    3.  **Subcategories - Bar Chart**:
        *   *X-Axis*: Individual subcategory names.
        *   *Y-Axis*: Sum of subcategory amounts in R$.
        *   *Colors*: Mapped to their respective parent category's color.
    4.  **Subcategories - Pie Chart**:
        *   *Visual*: Slices representing individual subcategories.
        *   *Labels*: Shows subcategory name and its percentage of contribution within its parent category.

### D. Flexible Incomes Charts
*   **Visual Type**: Toggleable chart. Identical in options and behavior to the Expenses Chart, but maps income-based categories and subcategories.
*   **Chart Options**:
    *   **Categories - Bar Chart** (Income category totals)
    *   **Categories - Pie Chart** (Income category share distribution)
    *   **Subcategories - Bar Chart** (Income subcategory breakdown)
    *   **Subcategories - Pie Chart** (Income subcategory share of parent category)
