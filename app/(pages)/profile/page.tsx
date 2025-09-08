import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export const metadata: Metadata = {
  title: "Profile | Alleato AI Dashboard",
  description: "User profile management page",
};

export default function Profile() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Profile components will be implemented here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
