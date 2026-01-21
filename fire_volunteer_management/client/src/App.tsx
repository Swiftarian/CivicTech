import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EmailTest from "./pages/EmailTest";
import GroupBooking from "./pages/GroupBooking";
import IndividualBooking from "./pages/IndividualBooking";
import BookingQuery from "./pages/BookingQuery";
import BookingEntry from "./pages/BookingEntry";

import AdminDashboard from "./pages/AdminDashboard";
import Traffic from "./pages/Traffic";
import MealDeliveryAdmin from "@/pages/MealDeliveryAdmin";
import DeliveryTracking from "@/pages/DeliveryTracking";
import VolunteerDelivery from "@/pages/VolunteerDelivery";
import BatchImportDelivery from "@/pages/BatchImportDelivery";
import DeliveryVerification from "@/pages/DeliveryVerification";
import VolunteerPerformanceDashboard from "@/pages/VolunteerPerformanceDashboard";
import ConfirmReceipt from "@/pages/ConfirmReceipt";
import SmsTest from "@/pages/SmsTest";
import TestLogin from "@/pages/TestLogin";
import RecipientManagement from "@/pages/admin/RecipientManagement";
import MealConfirm from "@/pages/MealConfirm";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Gallery from "@/pages/Gallery";
import NewsManagement from "@/pages/admin/NewsManagement";
import GalleryManagement from "@/pages/admin/GalleryManagement";
import HomeContentManagement from "@/pages/admin/HomeContentManagement";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/test-login"} component={TestLogin} />
      <Route path={"/email-test"} component={EmailTest} />
      <Route path={"/sms-test"} component={SmsTest} />
      <Route path="/booking" component={BookingEntry} />
      <Route path="/booking/group" component={GroupBooking} />
      <Route path="/booking/individual" component={IndividualBooking} />
      <Route path="/booking/query" component={BookingQuery} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/traffic" component={Traffic} />
      <Route path="/meal-delivery" component={MealDeliveryAdmin} />
      <Route path="/delivery-tracking" component={DeliveryTracking} />
      <Route path="/volunteer-delivery" component={VolunteerDelivery} />
      <Route path="/batch-import-delivery" component={BatchImportDelivery} />
      <Route
        path="/delivery-verification/:deliveryId"
        component={DeliveryVerification}
      />
      <Route
        path="/volunteer-performance"
        component={VolunteerPerformanceDashboard}
      />
      <Route path="/confirm-receipt/:deliveryId" component={ConfirmReceipt} />
      <Route path="/meal-confirm" component={MealConfirm} />
      <Route path="/admin/recipients" component={RecipientManagement} />
      <Route path="/admin/news" component={NewsManagement} />
      <Route path="/admin/gallery" component={GalleryManagement} />
      <Route path="/admin/home-content" component={HomeContentManagement} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
