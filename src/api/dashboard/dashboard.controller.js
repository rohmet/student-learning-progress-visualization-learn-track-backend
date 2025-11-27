import { supabase } from "../../config/supabase.js";

export const getMyDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    // Mengambil SEMUA Learning Path beserta Course-nya
    const { data: paths, error: pathError } = await supabase
      .from("learning_paths")
      .select(
        `
        id,
        name,
        courses (
          id,
          name,
          "order"
        )
      `
      )
      .order("name");

    if (pathError) throw pathError;

    // Mengambil semua enrollment user
    const { data: userEnrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("id, course_id")
      .eq("user_id", userId);

    if (enrollError) throw enrollError;

    // Buat Map: course_id -> enrollment_id
    const enrollmentMap = {};
    userEnrollments.forEach((e) => {
      enrollmentMap[e.course_id] = e.id;
    });

    // Menyusun Data Dashboard: Iterasi Path -> Course
    const dashboardData = await Promise.all(
      paths.map(async (path) => {
        const coursesWithProgress = await Promise.all(
          path.courses.map(async (course) => {
            const enrollmentId = enrollmentMap[course.id];
            let progress = 0;

            if (enrollmentId) {
              const { data: progressData, error: rpcError } =
                await supabase.rpc("get_course_progress", {
                  p_enrollment_id: enrollmentId,
                });
              if (!rpcError) progress = progressData;
            }

            return {
              course_id: course.id,
              course_name: course.name,
              enrollment_id: enrollmentId || null,
              progress_percent: progress,
              order: course.order,
            };
          })
        );

        // Cek apakah user punya setidaknya 1 enrollment di path ini
        const isEnrolledInPath = coursesWithProgress.some(
          (c) => c.enrollment_id !== null
        );

        // Jika TIDAK ADA enrollment sama sekali di path ini, kembalikan null
        if (!isEnrolledInPath) {
          return null;
        }

        // Urutkan course berdasarkan kolom 'order' (untuk tampilan urut)
        coursesWithProgress.sort((a, b) => a.order - b.order);

        // Hitung Rata-rata Progres Path
        // (Jumlah Progres Semua Course / Jumlah Course)
        const totalProgress = coursesWithProgress.reduce(
          (sum, c) => sum + c.progress_percent,
          0
        );
        const avgPathProgress =
          coursesWithProgress.length > 0
            ? totalProgress / coursesWithProgress.length
            : 0;

        return {
          path_id: path.id,
          path_name: path.name,
          path_progress_percent: Math.round(avgPathProgress), // Dibulatkan (misal: 55.67 -> 56)
          courses: coursesWithProgress,
        };
      })
    );

    // Buang nilai 'null' (Learning Path yang tidak diambil)
    const filteredDashboard = dashboardData.filter((item) => item !== null);

    res.status(200).json(filteredDashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEnrollmentDetails = async (req, res) => {
  const { enrollmentId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Ambil detail enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select(
        `
        id,
        course_id,
        user_id,
        courses ( name )
      `
      )
      .eq("id", enrollmentId)
      .eq("user_id", userId)
      .single();

    if (enrollError) throw enrollError;

    if (!enrollment) {
      return res
        .status(404)
        .json({ error: "Enrollment not found or you do not have access." });
    }

    // 2. Ambil SEMUA tutorial untuk course ini, DAN progress-nya
    const { data: tutorials, error: tutError } = await supabase
      .from("tutorials")
      .select(
        `
        id,
        title,
        order,
        tutorial_progress ( status )
      `
      )
      .eq("course_id", enrollment.course_id)
      .eq("tutorial_progress.enrollment_id", enrollmentId)
      .order("order", { ascending: true });

    if (tutError) throw tutError;

    // 3. Panggil lagi fungsi RPC untuk persentase total
    const { data: progressData, error: rpcError } = await supabase.rpc(
      "get_course_progress",
      { p_enrollment_id: enrollmentId }
    );
    if (rpcError) throw rpcError;

    // 4. Susun respons-nya
    const responseData = {
      enrollment_id: enrollment.id,
      course_name: enrollment.courses.name,
      progress_percent: progressData,
      tutorials: tutorials.map((t) => ({
        tutorial_id: t.id,
        title: t.title,
        order: t.order,
        status:
          t.tutorial_progress.length > 0
            ? t.tutorial_progress[0].status
            : "not_started",
      })),
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
