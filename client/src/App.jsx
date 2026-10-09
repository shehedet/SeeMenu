
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



function App() {
    return (
        <main className="min-h-screen bg-stone-50 p-8">
            <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-700">
                    Community-powered food discovery
                </p>

                <h1 className="text-4xl font-bold tracking-tight text-stone-900">
                    Welcome to SeeMenu
                </h1>

                <p className="mt-4 max-w-xl leading-7 text-stone-600">
                    Discover restaurants, explore community-uploaded menus,
                    and find your next favourite meal.
                </p>

                <button className="mt-6 rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white transition hover:bg-orange-800">
                    Explore restaurants
                </button>
            </section>
        </main>
    );
}

export default App;