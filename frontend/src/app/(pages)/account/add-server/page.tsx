"use client";
import AddServerForm from "@/components/form/add-server-form";
import { FC } from "react";

interface AddServerPageProps {}

const AddServerPage: FC<AddServerPageProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded-md p-4 w-full sm:w-fit gap-4 flex flex-col">
        <h1 className="text-2xl font-bold">Add Server</h1>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-4">
            <div className="w-screen max-w-2xl">
              <AddServerForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServerPage;
