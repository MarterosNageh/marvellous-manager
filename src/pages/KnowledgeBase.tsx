
import { MainLayout } from "@/components/layout/MainLayout";

const KnowledgeBase = () => {
  const googleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQidbcT1oulPIsVxDFO5zIJ_IMzJZ5tg5yDdnjDNTs1lJOEvyrX9p-1RxZpQ4pru1shqlbi__tfcCl3/pubhtml";

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <iframe 
            src={googleSheetUrl}
            className="w-full h-[calc(100vh-160px)]"
            title="Knowledge Base"
            frameBorder="0"
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default KnowledgeBase;
