import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { BookAppointment } from "./pages/BookAppointment";
import { MyReports } from "./pages/MyReports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "book-appointment", Component: BookAppointment },
      { path: "my-reports", Component: MyReports },
    ],
  },
]);
