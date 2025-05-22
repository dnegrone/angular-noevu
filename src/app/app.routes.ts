import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "machines",
        pathMatch: "full"
    },
    {
        path: "machines",
        loadChildren: () => import("./features/machines/machines.routes").then(m => m.MACHINE_ROUTES)
    },
];
