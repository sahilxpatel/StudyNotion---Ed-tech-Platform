import React, { useState, useEffect } from "react";
import { HomePageExplore } from "../../../data/homepage-explore";
import CourseCard from "./CourseCard";
import HighlightText from "./HighlightText";
import { apiConnector } from "../../../services/apiconnector";
import { courseEndpoints } from "../../../services/apis";

const tabsName = [
  "Free",
  "New to coding",
  "Most popular",
  "Skills paths",
  "Career paths",
];

const ExploreMore = () => {
  const [currentTab, setCurrentTab] = useState(tabsName[0]);
  const [courses, setCourses] = useState(HomePageExplore[0].courses);
  const [currentCard, setCurrentCard] = useState(
    HomePageExplore[0].courses[0].heading
  );
  const [fetchedTagMap, setFetchedTagMap] = useState(null);

  useEffect(() => {
    // Fetch published courses from backend and map them into tabs by tag
    const fetchCourses = async () => {
      try {
        const response = await apiConnector("GET", courseEndpoints.GET_ALL_COURSE_API);
        if (response?.data?.success) {
          const allCourses = response.data.data || [];

          // build a mapping from tag -> courses array
          const tagMap = {};
          tabsName.forEach((t) => (tagMap[t] = []));

          allCourses.forEach((c) => {
            if (Array.isArray(c.tag) && c.tag.length > 0) {
              c.tag.forEach((t) => {
                const normalizedTag = t.trim();
                const matchTab = tabsName.find((tab) => tab.toLowerCase() === normalizedTag.toLowerCase());
                if (matchTab) {
                  tagMap[matchTab].push(c);
                }
              });
            }
          });

          setFetchedTagMap(tagMap);

          // If no courses found for a tab, keep the static fallback
          const newCourses = tagMap[currentTab] && tagMap[currentTab].length ? tagMap[currentTab] : HomePageExplore[0].courses;
          setCourses(newCourses.map((course) => ({
            // map backend course to cardData shape used by CourseCard
            heading: course.courseName,
            description: course.courseDescription || course.whatYouWillLearn || "",
            level: "Beginner",
            lessionNumber: course.courseContent ? course.courseContent.length : 0,
            _rawCourse: course,
          })));
          setCurrentCard((prev) => (newCourses[0] ? (newCourses[0].courseName || newCourses[0].heading) : prev));
        }
      } catch (error) {
        // ignore and use static data
      }
    };

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMyCards = (value) => {
    setCurrentTab(value);
    // prefer fetched data if available
    if (fetchedTagMap && fetchedTagMap[value] && fetchedTagMap[value].length) {
      const mapped = fetchedTagMap[value].map((course) => ({
        heading: course.courseName,
        description: course.courseDescription || course.whatYouWillLearn || "",
        level: "Beginner",
        lessionNumber: course.courseContent ? course.courseContent.length : 0,
        _rawCourse: course,
      }));
      setCourses(mapped);
      setCurrentCard(mapped[0]?.heading || "");
      return;
    }

    const result = HomePageExplore.filter((course) => course.tag === value);
    if (result && result[0]) {
      setCourses(result[0].courses);
      setCurrentCard(result[0].courses[0].heading);
    } else {
      setCourses([]);
      setCurrentCard("");
    }
  };

  return (
    <div>
      {/* Explore more section */}
      <div>
        <div className="text-4xl font-semibold text-center my-10">
          Unlock the
          <HighlightText text={"Power of Code"} />
          <p className="text-center text-richblack-300 text-lg font-semibold mt-1">
            Learn to Build Anything You Can Imagine
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="hidden lg:flex gap-5 -mt-5 mx-auto w-max bg-richblack-800 text-richblack-200 p-1 rounded-full font-medium drop-shadow-[0_1.5px_rgba(255,255,255,0.25)]">
        {tabsName.map((ele, index) => {
          return (
            <div
              className={` text-[16px] flex flex-row items-center gap-2 ${
                currentTab === ele
                  ? "bg-richblack-900 text-richblack-5 font-medium"
                  : "text-richblack-200"
              } px-7 py-[7px] rounded-full transition-all duration-200 cursor-pointer hover:bg-richblack-900 hover:text-richblack-5`}
              key={index}
              onClick={() => setMyCards(ele)}
            >
              {ele}
            </div>
          );
        })}
      </div>
      <div className="hidden lg:block lg:h-[200px]"></div>

      {/* Cards Group */}
      <div className="lg:absolute gap-10 justify-center lg:gap-0 flex lg:justify-between flex-wrap w-full lg:bottom-[0] lg:left-[50%] lg:translate-x-[-50%] lg:translate-y-[50%] text-black lg:mb-0 mb-7 lg:px-0 px-3">
        {courses.map((ele, index) => {
          return (
            <CourseCard
              key={index}
              cardData={ele}
              currentCard={currentCard}
              setCurrentCard={setCurrentCard}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ExploreMore;