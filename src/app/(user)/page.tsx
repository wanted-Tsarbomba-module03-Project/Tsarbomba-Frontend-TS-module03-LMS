import { redirect } from "next/navigation";
import {
  getUserCoursesServer,
  UnauthorizedError,
} from "@/features/course/server";
import CourseListClient from "@/features/course/components/CourseListClient";

export default async function StudentCourseListPage() {
  let courses;

  try {
    courses = await getUserCoursesServer();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/auth/login");
    throw error;
  }

  const activeCourses = courses.filter((course) => course.status === "ACTIVE");

  return <CourseListClient initialCourses={activeCourses} />;
}
