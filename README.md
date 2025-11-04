# Lenny D&D Bot Data

Generate the data for the Lenny D&D bot. Automatically formats the descriptions for the Discord embeds.

## Interface generation

In order to more easily navigate the raw JSON, interfaces are defined in the raw data in `src/interfaces.ts`. In order to use these interfaces to validate data, checkers are used to validate the objects at runtime. [These checkers are generated thanks to ts-interface-checker](https://github.com/gristlabs/ts-interface-checker) using the command `npm run interfaces`.

The checkers and interfaces are then used as follows (example for Action):

```TypeScript
import interfacesTI from '../interfaces-ti';
import { Action } from "../interfaces"
import { createCheckers } from 'ts-interface-checker';

const checkers = createCheckers(interfacesTI);
const ActionChecker = checkers.Action;

...
const actions = validate<Action>(data.action, ActionChecker); // will be of type Action[]. Will throw an error on failure
```
