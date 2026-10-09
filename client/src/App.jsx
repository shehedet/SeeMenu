
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";

// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import ContributorTest from "./pages/ContributorTest";
// import ModeratorTest from "./pages/ModeratorTest";
// import AdminTest from "./pages/AdminTest";

// function App() {
//     return (
//         <AuthProvider>
//             <BrowserRouter>
//                 <Routes>
//                     {/* Public routes */}
//                     <Route path="/" element={<Home />} />
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/signup" element={<Signup />} />

//                     {/* All authenticated contributors and above */}
//                     <Route
//                         element={
//                             <ProtectedRoute
//                                 allowedRoles={[
//                                     "contributor",
//                                     "moderator",
//                                     "admin"
//                                 ]}
//                             />
//                         }
//                     >
//                         <Route
//                             path="/contributor-test"
//                             element={<ContributorTest />}
//                         />
//                     </Route>

//                     {/* Moderators and admins */}
//                     <Route
//                         element={
//                             <ProtectedRoute
//                                 allowedRoles={["moderator", "admin"]}
//                             />
//                         }
//                     >
//                         <Route
//                             path="/moderator-test"
//                             element={<ModeratorTest />}
//                         />
//                     </Route>

//                     {/* Admins only */}
//                     <Route
//                         element={
//                             <ProtectedRoute
//                                 allowedRoles={["admin"]}
//                             />
//                         }
//                     >
//                         <Route
//                             path="/admin-test"
//                             element={<AdminTest />}
//                         />
//                     </Route>
//                 </Routes>
//             </BrowserRouter>
//         </AuthProvider>
//     );
// }

// export default App;




import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

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