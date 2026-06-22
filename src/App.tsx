import { Route, Routes } from "react-router-dom";
import { useThemeEffect } from "@/hooks/useTheme";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { EquipmentPage } from "@/pages/EquipmentPage";
import { UpdatePage } from "@/pages/UpdatePage";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  useThemeEffect();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/equipamento/:id" element={<EquipmentPage />} />
        <Route path="/atualizacao/:id" element={<UpdatePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
