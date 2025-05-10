
import { useState, useEffect } from "react";

import { MainLayout } from "@/components/layout/MainLayout";

const ShiftsSchedule = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-3xl font-bold mb-4">Shifts Schedule</h1>
        <p className="text-xl text-gray-600 mb-6">Coming Soon</p>
        <p className="text-gray-500 max-w-md text-center">
          This page will soon display shifts schedule for all users and teams. Stay tuned!
        </p>
      </div>
    </MainLayout>
  );
};

export default ShiftsSchedule;
