import { Application } from "@nocobase/client";
import { initialGeneralActionTrigger } from "./actions/GeneralAction";
import { initialTableOpActionTrigger } from "./actions/TableOpAction";

export function initialActionTrigger(app: Application) {
    initialGeneralActionTrigger(app);
    initialTableOpActionTrigger(app);
};