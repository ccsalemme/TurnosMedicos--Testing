import { useState } from "react";
import { FileText, Download, Calendar, Search, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface Report {
  id: string;
  title: string;
  date: string;
  type: string;
  doctor: string;
  status: "completed" | "pending";
  description: string;
}

export function MyReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Mock data for reports
  const [reports] = useState<Report[]>([
    {
      id: "1",
      title: "Blood Test - Complete Blood Count",
      date: "2026-02-20",
      type: "Laboratory",
      doctor: "Dr. Sarah Johnson",
      status: "completed",
      description: "Routine blood test results showing all parameters within normal range.",
    },
    {
      id: "2",
      title: "X-Ray - Chest",
      date: "2026-02-18",
      type: "Radiology",
      doctor: "Dr. Michael Chen",
      status: "completed",
      description: "Chest X-ray examination - No abnormalities detected.",
    },
    {
      id: "3",
      title: "ECG Report",
      date: "2026-02-15",
      type: "Cardiology",
      doctor: "Dr. Emily Davis",
      status: "completed",
      description: "Electrocardiogram showing normal sinus rhythm.",
    },
    {
      id: "4",
      title: "MRI Scan - Brain",
      date: "2026-02-25",
      type: "Radiology",
      doctor: "Dr. Robert Wilson",
      status: "pending",
      description: "Brain MRI scan scheduled. Results will be available soon.",
    },
    {
      id: "5",
      title: "Lipid Profile",
      date: "2026-02-12",
      type: "Laboratory",
      doctor: "Dr. Sarah Johnson",
      status: "completed",
      description: "Comprehensive cholesterol and triglycerides test.",
    },
  ]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const reportTypes = Array.from(new Set(reports.map((r) => r.type)));

  const handleDownload = (reportId: string, title: string) => {
    // Mock download functionality
    console.log(`Downloading report ${reportId}: ${title}`);
    alert(`Downloading: ${title}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-4">My Medical Reports</h1>
          <p className="text-lg text-gray-600">
            Access and download all your medical reports in one place
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reports by name or doctor..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "You don't have any medical reports yet"}
              </p>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl text-gray-900">
                            {report.title}
                          </h3>
                          <Badge
                            variant={
                              report.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              report.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {report.status === "completed"
                              ? "Available"
                              : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-15">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(report.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                      <div className="text-gray-600">by {report.doctor}</div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    {report.status === "completed" ? (
                      <>
                        <Button
                          onClick={() => handleDownload(report.id, report.title)}
                          className="flex-1 md:flex-none"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none">
                          View
                        </Button>
                      </>
                    ) : (
                      <Button disabled className="flex-1 md:flex-none">
                        Processing...
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Info Section */}
        {filteredReports.length > 0 && (
          <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">ℹ</span>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">
                  About Your Reports
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • Reports are typically available within 24-48 hours of your
                    test
                  </li>
                  <li>
                    • Downloaded reports are in PDF format and can be shared with
                    other healthcare providers
                  </li>
                  <li>
                    • If you have questions about your results, please contact
                    your doctor
                  </li>
                  <li>
                    • All reports are securely stored and accessible anytime
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
