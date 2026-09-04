/**
 * VehicleHub Browse & Filter Client Scripts
 * - Mobile Filter Sidebar Drawer
 * - Dynamic URL parameter management
 */

document.addEventListener("DOMContentLoaded", () => {
    const filterToggle = document.getElementById("filterToggle");
    const filterSidebar = document.getElementById("filterSidebar");
    const closeSidebar = document.getElementById("closeSidebar");

    if (filterToggle && filterSidebar) {
        filterToggle.addEventListener("click", () => {
            filterSidebar.classList.add("open");
        });
    }

    if (closeSidebar && filterSidebar) {
        closeSidebar.addEventListener("click", () => {
            filterSidebar.classList.remove("open");
        });
    }
});
