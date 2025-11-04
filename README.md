# Lenny D&D Bot Data

Generate the data for the Lenny D&D bot. Automatically formats the descriptions for the Discord embeds.

## Interface generation

In order to more easily navigate the raw JSON, interfaces are defined in the raw data in `src/interfaces.ts`. In order to use these interfaces to validate data, validators are used to validate the objects at runtime. [These validators are generated thanks to ts-interface-checker](https://github.com/gristlabs/ts-interface-checker) using the command `npm run interfaces`.

The validators are provided in `src/validate.ts`. They can be used as follows, using Action as an example.

```TypeScript
import { ActionValidator } from '../validate';

...

const actions = ActionValidator.validate(data.action); // will return type Action[], or throw an error on failure.
```
