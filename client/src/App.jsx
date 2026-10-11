import { Navigate, Route, Routes } from "react-router-dom";
import RestaurantDetails from "./pages/RestaurantDetails";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MenuUpload from "./pages/MenuUpload";
import ContributorTest from "./pages/ContributorTest";
import ModeratorTest from "./pages/ModeratorTest";
import AdminTest from "./pages/AdminTest";
import RestaurantRequest from "./pages/RestaurantRequest";
import ContributorProfile from "./pages/ContributorProfile";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/restaurants/:id" element={<RestaurantDetails />} />

            <Route path="/contributors/:username" element={<ContributorProfile />} />


            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "contributor",
                            "moderator",
                            "admin"
                        ]}
                    />
                }
            >
                <Route
                    path="/contributor-test"
                    element={<ContributorTest />}
                />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["contributor"]} />}>
                <Route path="/upload-menu" element={<MenuUpload />} />
                <Route path="/request-restaurant" element={<RestaurantRequest />} />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["moderator", "admin"]}
                    />
                }
            >
                <Route
                    path="/moderator-test"
                    element={<ModeratorTest />}
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute allowedRoles={["admin"]} />
                }
            >
                <Route
                    path="/admin-test"
                    element={<AdminTest />}
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;