"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

const FMGlobalNavigator = () => {
  const [currentStep] = useState($2);
  const [path, setPath] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnimating] = useState($2);
  // Decision tree structure based on FM Global 8-34 Figure 1
  const decisionTree = {
    start: {
      type: "decision",
      question:
        "Is the ASRS storage arrangement Vertically Enclosed per Appendix A?",
      description:
        "Vertically enclosed systems have structural barriers that prevent fire spread between levels.",
      options: [
        { label: "Yes", value: "yes", next: "vertically_enclosed" },
        { label: "No", value: "no", next: "top_loading_check" },
      ],
    },
    vertically_enclosed: {
      type: "result",
      title: "Vertically Enclosed Protection",
      section: "Section 2.4",
      description:
        "Follow the protection guidelines in Section 2.4 for vertically enclosed ASRS arrangements.",
      icon: "shield",
      color: "blue",
    },
    top_loading_check: {
      type: "decision",
      question:
        "Will the ASRS storage arrangement be Top-Loading (see Appendix A)?",
      description:
        "Top-loading systems load containers from above, typically using overhead cranes or mechanisms.",
      options: [
        { label: "Yes", value: "yes", next: "top_loading_container_type" },
        { label: "No", value: "no", next: "horizontal_loading_check" },
      ],
    },
    top_loading_container_type: {
      type: "decision",
      question: "What type of containers will be used?",
      description:
        "Container material and design significantly impact fire protection requirements.",
      options: [
        {
          label: "Solid-walled and noncombustible",
          value: "noncombustible",
          next: "top_loading_noncombustible",
        },
        {
          label: "Solid-walled and combustible",
          value: "combustible",
          next: "top_loading_combustible",
        },
      ],
    },
    top_loading_noncombustible: {
      type: "result",
      title: "Top-Loading: Noncombustible Containers",
      section: "Sections 2.3.1-2.3.4 + Section 2.3.5",
      description:
        "Follow general recommendations in Sections 2.3.1 through 2.3.4, then apply protection guidelines in Section 2.3.5.",
      icon: "shield",
      color: "green",
    },
    top_loading_combustible: {
      type: "result",
      title: "Top-Loading: Combustible Containers",
      section: "Sections 2.3.1-2.3.4 + Section 2.3.6",
      description:
        "Follow general recommendations in Sections 2.3.1 through 2.3.4, then apply protection guidelines in Section 2.3.6.",
      icon: "shield",
      color: "orange",
    },
    horizontal_loading_check: {
      type: "decision",
      question:
        "Will the ASRS storage arrangement be Horizontal-Loading (see Appendix A)?",
      description:
        "Horizontal-loading systems move containers horizontally into storage positions.",
      options: [
        { label: "Yes", value: "yes", next: "horizontal_loading_type" },
        { label: "No", value: "no", next: "out_of_scope" },
      ],
    },
    horizontal_loading_type: {
      type: "decision",
      question: "What type of horizontal-loading ASRS will be used?",
      description:
        "Different ASRS types have distinct operational characteristics and protection needs.",
      options: [
        {
          label: "Shuttle type (see Appendix A)",
          value: "shuttle",
          next: "shuttle_container_type",
        },
        {
          label: "Mini-Load type (see Appendix A)",
          value: "miniload",
          next: "miniload_container_type",
        },
      ],
    },
    shuttle_container_type: {
      type: "decision",
      question: "What type of containers will be used in the Shuttle ASRS?",
      description:
        "Container characteristics determine sprinkler protection requirements and spacing.",
      options: [
        {
          label: "Noncombustible closed-top or nonpropagating",
          value: "noncombustible_closed",
          next: "shuttle_noncombustible",
        },
        {
          label: "Combustible closed-top",
          value: "combustible_closed",
          next: "shuttle_combustible",
        },
        {
          label: "Other container types",
          value: "other",
          next: "shuttle_other",
        },
      ],
    },
    shuttle_noncombustible: {
      type: "result",
      title: "Shuttle ASRS: Noncombustible Closed-Top",
      section: "Section 2.2.1 + Section 2.2.4",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.4.",
      icon: "truck",
      color: "green",
      details: {
        figures: ["4-13"],
        tables: ["14-16"],
        keyRequirements: [
          "Maximum rack depth varies by spacing",
          "Closed-top containers reduce fire risk",
          "Standard sprinkler arrangements apply",
        ],
      },
    },
    shuttle_combustible: {
      type: "result",
      title: "Shuttle ASRS: Combustible Closed-Top",
      section: "Section 2.2.1 + Section 2.2.2",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.2.",
      icon: "truck",
      color: "orange",
      details: {
        figures: ["4-13"],
        tables: ["14-16"],
        keyRequirements: [
          "Enhanced protection for combustible materials",
          "May require additional sprinkler density",
          "Flue space requirements critical",
        ],
      },
    },
    shuttle_other: {
      type: "result",
      title: "Shuttle ASRS: Other Container Types",
      section: "Section 2.2.1 + Section 2.2.3",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.3.",
      icon: "truck",
      color: "red",
    },
    miniload_container_type: {
      type: "decision",
      question: "What type of containers will be used in the Mini-Load ASRS?",
      description:
        "Mini-load systems typically handle smaller containers with different protection needs.",
      options: [
        {
          label: "Noncombustible closed-top or nonpropagating",
          value: "noncombustible_closed",
          next: "miniload_noncombustible",
        },
        {
          label: "Combustible closed-top",
          value: "combustible_closed",
          next: "miniload_combustible",
        },
        {
          label: "Other container types",
          value: "other",
          next: "miniload_other",
        },
      ],
    },
    miniload_noncombustible: {
      type: "result",
      title: "Mini-Load ASRS: Noncombustible Closed-Top",
      section: "Section 2.2.1 + Section 2.2.7",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.7.",
      icon: "package",
      color: "green",
      details: {
        figures: ["26-45"],
        tables: ["17-19"],
        keyRequirements: [
          "Horizontal IRAS layouts required",
          "Specific depth and spacing limitations",
          "Transverse flue space considerations",
        ],
      },
    },
    miniload_combustible: {
      type: "result",
      title: "Mini-Load ASRS: Combustible Closed-Top",
      section: "Section 2.2.1 + Section 2.2.5",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.5.",
      icon: "package",
      color: "orange",
    },
    miniload_other: {
      type: "result",
      title: "Mini-Load ASRS: Other Container Types",
      section: "Section 2.2.1 + Section 2.2.6",
      description:
        "Follow general recommendations in Section 2.2.1, then apply protection guidelines in Section 2.2.6.",
      icon: "package",
      color: "red",
    },
    out_of_scope: {
      type: "result",
      title: "Outside Scope",
      section: "Not Covered",
      description:
        "The ASRS arrangement is outside the scope of Data Sheet 8-34. Consult with FM Global for specialized guidance.",
      icon: "alert-circle",
      color: "gray",
    },
  };

  const handleAnswer = (answer: unknown) => {
    setIsAnimating(true);
    const newAnswers = { ...answers, [currentStep]: answer };
    setAnswers(newAnswers);
    setPath([...path, currentStep]);

    setTimeout(() => {
      setCurrentStep(answer.next);
      setIsAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (path.length > 0) {
      setIsAnimating(true);
      const previousStep = path[path.length - 1];
      setPath(path.slice(0, -1));
      delete answers[previousStep];

      setTimeout(() => {
        setCurrentStep(previousStep);
        setIsAnimating(false);
      }, 300);
    }
  };

  const restart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep("start");
      setPath([]);
      setAnswers({});
      setIsAnimating(false);
    }, 300);
  };

  const current = (decisionTree as any)[currentStep];
  const isResult = current?.type === "result";

  const getIcon = (iconName: unknown) => {
    switch (iconName) {
      case "shield":
        return <CheckCircle className="w-8 h-8" />;
      case "truck":
        return <ChevronRight className="w-8 h-8" />;
      case "package":
        return <FileText className="w-8 h-8" />;
      case "alert-circle":
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <FileText className="w-8 h-8" />;
    }
  };

  const getColorClasses = (color: unknown) => {
    switch (color) {
      case "green":
        return "bg-green-50 border-green-200 text-green-800";
      case "blue":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "orange":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "red":
        return "bg-red-50 border-red-200 text-red-800";
      case "gray":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FM Global 8-34 Interactive Navigator
        </h1>
        <p className="text-gray-600">
          Navigate through ASRS protection requirements step by step
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{path.length + 1} steps</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((path.length + 1) * 12.5, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {isResult ? (
          /* Result Page */
          <div
            className={`rounded-lg border-2 p-8 ${getColorClasses(
              current.color
            )}`}
          >
            <div className="flex items-center mb-6">
              {getIcon(current.icon)}
              <h2 className="text-2xl font-bold ml-3">{current.title}</h2>
            </div>

            <div className="mb-6">
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Required Section:</h3>
                <p className="text-lg font-mono">{current.section}</p>
              </div>

              <p className="text-lg leading-relaxed">{current.description}</p>
            </div>

            {current.details && (
              <div className="bg-white bg-opacity-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4">Implementation Details:</h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Relevant Figures:</h4>
                    <p className="text-sm">
                      Figures {current.details.figures.join(", ")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Relevant Tables:</h4>
                    <p className="text-sm">
                      Tables {current.details.tables.join(", ")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Requirements:</h4>
                  <ul className="text-sm space-y-1">
                    {current.details.keyRequirements.map((req: unknown, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-current rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Path Summary */}
            <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Your Selection Path:</h3>
              <div className="text-sm space-y-1">
                {path.map((step, idx) => {
                  const stepData = (decisionTree as any)[step];
                  const answer = answers[step];
                  return (
                    <div key={idx} className="flex items-center">
                      <span className="font-medium">{stepData?.question}</span>
                      <ChevronRight className="w-4 h-4 mx-2" />
                      <span className="italic">{answer?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Decision Page */
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {current?.question}
            </h2>

            {current?.description && (
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {current.description}
              </p>
            )}

            <div className="space-y-4">
              {current?.options?.map((option: unknown, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="w-full p-6 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium group-hover:text-blue-700">
                      {option.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goBack}
          disabled={path.length === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>

        <button
          onClick={restart}
          className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Start Over
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> This interactive navigator helps you quickly
          identify the correct FM Global 8-34 sections for your specific ASRS
          configuration. Each result provides the exact sections, figures, and
          tables you need to reference.
        </p>
      </div>
    </div>
  );
};

export default FMGlobalNavigator;
