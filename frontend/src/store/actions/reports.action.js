import { server } from "@/server/servert";
import axios from "axios";

// Load all Reports with search and pagination
export const loadReports =
  (page = 1, limit = 10, search = "", status = "all") =>
  async (dispatch) => {
    try {
      dispatch({ type: "LoadReportsRequest" });

      let url = `${server}/reports/admin/all?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status !== "all") url += `&status=${status}`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      // console.log(data)

      dispatch({
        type: "LoadReportsSuccess",
        payload: {
          reports: data.reports,
          pagination: data.pagination,
        },
      });
    } catch (error) {
      dispatch({
        type: "LoadReportsFail",
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Export report PDF
export const exportReportPDF = (reportId) => async (dispatch) => {
  try {
    dispatch({ type: "ExportReportRequest" });

    const response = await axios.get(
      `${server}/reports/admin/${reportId}/export`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    dispatch({
      type: "ExportReportSuccess",
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "ExportReportFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Delete report
export const deleteReport = (reportId) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteReportRequest" });

    await axios.delete(`${server}/reports/admin/${reportId}`, {
      withCredentials: true,
    });

    dispatch({
      type: "DeleteReportSuccess",
      payload: reportId,
    });

    return { success: true };
  } catch (error) {
    dispatch({
      type: "DeleteReportFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, error: error.response?.data?.message || error.message };
  }
};