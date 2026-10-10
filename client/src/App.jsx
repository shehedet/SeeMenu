import { Navigate, Route, Routes } from "react-router-dom";
import RestaurantDetails from "./pages/RestaurantDetails";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MenuUpload from "./pages/MenuUpload";
import ContributorTest from "./pages/ContributorTest";
import ModeratorTest from "./pages/ModeratorTest";
import AdminTest from "./pages/AdminTest";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/restaurants/:id" element={<RestaurantDetails />} />

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