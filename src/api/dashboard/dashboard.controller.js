import { supabase } from "../../config/supabase.js";

export const getMyDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(
        `
        id, 
        course_id,
        courses (
          name,
          learning_paths ( name )
        )
      `
      )
      .eq("user_id", userId);

    if (enrollError) throw enrollError;

    const dashboardData = await Promise.all(
      enrollments.map(async (enroll) => {
        const { data: progressData, error: rpcError } = await supabase.rpc(
          "get_course_progress",
          { p_enrollment_id: enroll.id }
        );

        if (rpcError) throw rpcError;

        return {
          enrollment_id: enroll.id,
          course: {
            course_id: enroll.course_id,
            name: enroll.courses.name,
            learning_path: enroll.courses.learning_paths.name,
          },
          progress_percent: progressData,
        };
      })
    );

    res.status(200).json({
      user: {
        name: req.user.user_metadata?.full_name || req.user.email,
        email: req.user.email,
      },
      enrollments: dashboardData,
    });
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
