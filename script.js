document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const approvedCreditsSpan = document.getElementById('approved-credits');
    let totalApprovedCredits = 0;

    // Load state from localStorage
    loadCourseState();
    updateTotalCredits();

    courses.forEach(course => {
        course.addEventListener('click', () => {
            if (!course.classList.contains('disabled') && !course.classList.contains('approved')) {
                approveCourse(course);
            }
        });
    });

    function approveCourse(course) {
        course.classList.add('approved');
        course.classList.remove('disabled'); // Ensure it's not disabled if it was approved through click
        // Add a class to trigger the line-through animation after a short delay
        setTimeout(() => {
            course.classList.add('animate-line');
        }, 10); // Small delay to ensure the class is added and CSS transition can apply

        updateTotalCredits(parseInt(course.dataset.credits));
        unlockDependencies(course);
        saveCourseState();
    }

    function unlockDependencies(approvedCourse) {
        const unlocks = approvedCourse.dataset.unlocks;
        if (unlocks) {
            const unlockedCourseIds = unlocks.split(',');
            unlockedCourseIds.forEach(id => {
                const targetCourse = document.getElementById(id.trim());
                if (targetCourse && arePrerequisitesMet(targetCourse)) {
                    targetCourse.classList.remove('disabled');
                }
            });
        }
    }

    function arePrerequisitesMet(course) {
        const prerequisites = course.dataset.prerequisites;
        const prerequisitesCredits = parseInt(course.dataset.prerequisitesCredits);

        // Check credit prerequisite
        if (!isNaN(prerequisitesCredits) && totalApprovedCredits < prerequisitesCredits) {
            return false;
        }

        // Check course prerequisites
        if (prerequisites) {
            const prerequisiteIds = prerequisites.split(',');
            for (const id of prerequisiteIds) {
                const prereqCourse = document.getElementById(id.trim());
                if (!prereqCourse || !prereqCourse.classList.contains('approved')) {
                    return false;
                }
            }
        }
        return true;
    }

    function updateTotalCredits(credits = 0) {
        if (credits > 0) {
            totalApprovedCredits += credits;
        } else {
            // Recalculate total if credits argument is 0 (on page load)
            totalApprovedCredits = 0;
            document.querySelectorAll('.course.approved').forEach(approvedCourse => {
                totalApprovedCredits += parseInt(approvedCourse.dataset.credits);
            });
        }
        approvedCreditsSpan.textContent = totalApprovedCredits;
        // After updating credits, re-evaluate all courses for unlocking
        courses.forEach(course => {
            if (!course.classList.contains('approved') && arePrerequisitesMet(course)) {
                course.classList.remove('disabled');
            } else if (!course.classList.contains('approved') && !arePrerequisitesMet(course)) {
                course.classList.add('disabled');
            }
        });
    }

    function saveCourseState() {
        const courseStates = {};
        courses.forEach(course => {
            courseStates[course.id] = {
                approved: course.classList.contains('approved'),
                disabled: course.classList.contains('disabled')
            };
        });
        localStorage.setItem('courseStates', JSON.stringify(courseStates));
    }

    function loadCourseState() {
        const savedStates = JSON.parse(localStorage.getItem('courseStates'));
        if (savedStates) {
            courses.forEach(course => {
                const state = savedStates[course.id];
                if (state) {
                    if (state.approved) {
                        course.classList.add('approved');
                        // No need to add 'animate-line' on load, as it's already "approved"
                    } else {
                        course.classList.remove('approved');
                        course.classList.remove('animate-line');
                    }
                    if (state.disabled) {
                        course.classList.add('disabled');
                    } else {
                        course.classList.remove('disabled');
                    }
                }
            });
        } else {
            // Initial state: all courses with prerequisites are disabled
            courses.forEach(course => {
                if (course.dataset.prerequisites || course.dataset.prerequisitesCredits) {
                    course.classList.add('disabled');
                }
            });
        }
        // Re-evaluate all courses after loading state to ensure correct unlocking
        courses.forEach(course => {
            if (!course.classList.contains('approved') && arePrerequisitesMet(course)) {
                course.classList.remove('disabled');
            } else if (!course.classList.contains('approved') && !arePrerequisitesMet(course)) {
                course.classList.add('disabled');
            }
        });
    }

    // Initial check for all courses on load to ensure correct disabled state
    courses.forEach(course => {
        if (!course.classList.contains('approved')) { // Only apply to not yet approved courses
            if (!arePrerequisitesMet(course)) {
                course.classList.add('disabled');
            }
        }
    });

});
