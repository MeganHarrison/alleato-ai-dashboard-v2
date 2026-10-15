import ASRSDesignForm from "@/components/asrs/ASRSDesignForm";
import { PageHeader } from "@/components/page-header";

export default function ASRSDesignPage() {
  return (
    <div>
      <div>
        <PageHeader
          title="FM Global 8-34 Requirements"
          description="Complete the form below to identify the requirements for your ASRS sprinkler system."
        />
      </div>
      <div>
        <ASRSDesignForm />
      </div>
    </div>
  );
}
