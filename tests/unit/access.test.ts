import { describe, it, expect } from "vitest";
import { getCourseProgress } from "@/server/access";

// getCourseProgress is a pure function — no DB needed

type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type MockLesson = { progress: Array<{ status: ProgressStatus }> };
type MockModule = { lessons: MockLesson[] };
type MockCourse = { modules: MockModule[] };

function makeCourse(lessonStatuses: ProgressStatus[]): MockCourse {
  return {
    modules: [
      {
        lessons: lessonStatuses.map((status) => ({
          progress: status !== "NOT_STARTED" ? [{ status }] : [],
        })),
      },
    ],
  };
}

describe("getCourseProgress", () => {
  it("returns 0% when no lessons exist", () => {
    const result = getCourseProgress({ modules: [] } as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result).toEqual({ total: 0, completed: 0, percent: 0 });
  });

  it("returns 0% when no lessons are completed", () => {
    const course = makeCourse(["NOT_STARTED", "IN_PROGRESS"]);
    const result = getCourseProgress(course as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("returns 100% when all lessons are completed", () => {
    const course = makeCourse(["COMPLETED", "COMPLETED", "COMPLETED"]);
    const result = getCourseProgress(course as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(3);
    expect(result.percent).toBe(100);
  });

  it("returns 50% when half the lessons are completed", () => {
    const course = makeCourse(["COMPLETED", "NOT_STARTED", "COMPLETED", "IN_PROGRESS"]);
    const result = getCourseProgress(course as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result.total).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.percent).toBe(50);
  });

  it("rounds the percentage", () => {
    const course = makeCourse(["COMPLETED", "NOT_STARTED", "NOT_STARTED"]);
    const result = getCourseProgress(course as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result.percent).toBe(33);
  });

  it("returns null-safe result for a null course", () => {
    const result = getCourseProgress(null as unknown as Parameters<typeof getCourseProgress>[0]);
    expect(result).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});
