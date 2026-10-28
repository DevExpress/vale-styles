# Bind the Grid to Data

This sample must not trigger any rule. The smoke test (`npm test`) fails if Vale reports an alert for this file.

The Grid displays data from a local array or a remote service. To bind the Grid to data, set the `dataSource` property:

```js
const grid = new Grid(element, { dataSource: orders });
```

## Data Source Types

The Grid supports the following data source types:

- A local array of objects.
- A remote service that returns JSON.
- A custom store that loads data on demand.

Refer to the following topic for more information: [Data Binding](data-binding.md).
