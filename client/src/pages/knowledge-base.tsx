import { useState } from "react";
import QATab from "@/components/knowledge-base/QATab";
import AuthTab from "@/components/knowledge-base/AuthTab";
import AddProductTab from "@/components/knowledge-base/AddProductTab";
import BulkUploadTab from "@/components/knowledge-base/BulkUploadTab";
import ManageProductsTab from "@/components/knowledge-base/ManageProductsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("qa");

  return (
    <div className="h-full overflow-y-auto">
      {/* Header - Centered */}
      <div className="max-w-7xl mx-auto px-6 pt-8 md:px-8 md:pt-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage documents and products for your chatbot
          </p>
        </div>

        {/* Horizontal Tabs - Chrome Style */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab("qa")}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 relative border-b-2 ${
                activeTab === "qa"
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50"
              }`}
            >
              Q&A
            </button>
            <button
              onClick={() => setActiveTab("add-product")}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 relative border-b-2 ${
                activeTab === "add-product"
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50"
              }`}
            >
              Add Products
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Full Width */}
      <div className="w-full px-6 pb-8 md:px-8 md:pb-12">
        {activeTab === "qa" && <QATab />}
        {activeTab === "add-product" && (
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="single">Single Product</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              <TabsTrigger value="manage">Manage Products</TabsTrigger>
            </TabsList>
            <TabsContent value="api" className="mt-0">
              <AuthTab />
            </TabsContent>
            <TabsContent value="single" className="mt-0">
              <AddProductTab />
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <BulkUploadTab />
            </TabsContent>
            <TabsContent value="manage" className="mt-0">
              <ManageProductsTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
