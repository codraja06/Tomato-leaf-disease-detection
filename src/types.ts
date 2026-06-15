export interface DetectionResult {
  id: string;
  timestamp: number;
  diseaseName: string;
  confidence: number;
  recommendedProduct: string;
  naturalTreatment: string;
  explanation?: string;
  cause?: string;
  productUrl?: string;
  imageUrl: string;
  imageSize?: string;
  isCachedFallback?: boolean;
}

export const DISEASE_METADATA: Record<string, { product: string; treatment: string; explanation: string; cause: string; productUrl: string }> = {
  "Bacterial Spot": {
    product: "Copper-based fungicides",
    treatment: "Remove infected leaves immediately. Spray copper fungicide every 7-10 days. Avoid watering the leaves and water only at the base of the plant.",
    explanation: "Detected small, water-soaked spots on leaves that eventually turn brown or black, typical of bacterial infection.",
    cause: "Caused by bacterium Xanthomonas, spreads via splashing rain or overhead irrigation in warm, humid weather.",
    productUrl: "https://www.amazon.com/s?k=Copper+fungicide+for+tomatoes"
  },
  "Early Blight": {
    product: "Chlorothalonil or Mancozeb",
    treatment: "Remove affected leaves and dispose of them away from the garden. Spray fungicide every week. Keep mulch around the plant to prevent disease spread from soil.",
    explanation: "Identification of concentric rings and 'bullseye' patterns on older leaves, characteristic of Alternaria fungus.",
    cause: "Caused by the fungus Alternaria solani, which survives in soil and crop debris and thrives in humid conditions.",
    productUrl: "https://www.amazon.com/s?k=Chlorothalonil+fungicide"
  },
  "Late Blight": {
    product: "Ridomil Gold or Copper Fungicide",
    treatment: "Remove heavily infected plants immediately to stop the spread. Spray recommended fungicide and avoid overhead watering. Ensure good airflow between plants.",
    explanation: "Observed large, irregular greenish-gray water-soaked patches that rapidly turn brown and papery.",
    cause: "Caused by the water mold Phytophthora infestans, spreading rapidly through wind and cool, wet weather.",
    productUrl: "https://www.amazon.com/s?k=Ridomil+Gold+fungicide"
  },
  "Leaf Mold": {
    product: "Calcium-based sprays",
    treatment: "Remove infected leaves and improve ventilation around plants. Reduce humidity and spray calcium-based products as recommended.",
    explanation: "Spied pale greenish-yellow spots on the upper leaf surface with olive-green mold on the underside.",
    cause: "Caused by the fungus Passalora fulva, primarily in high-humidity environments like poorly ventilated greenhouses.",
    productUrl: "https://www.amazon.com/s?k=Calcium+spray+for+plants"
  },
  "Septoria Leaf Spot": {
    product: "Fungicides containing chlorothalonil",
    treatment: "Remove infected lower leaves. Apply fungicide every 7-10 days and avoid wetting the foliage while watering.",
    explanation: "Visual confirmation of circular spots with gray centers and dark brown margins on lower leaves.",
    cause: "Caused by the fungus Septoria lycopersici, spreading from the soil up the plant via rain splashes.",
    productUrl: "https://www.amazon.com/s?k=Septoria+fungicide"
  },
  "Spider Mites (Two-spotted Spider Mite)": {
    product: "Neem oil or Insecticidal soap",
    treatment: "Spray neem oil or insecticidal soap on both sides of the leaves. Repeat every 5-7 days until mites are controlled.",
    explanation: "Detected fine stippling (small yellow dots) on the leaf surface and presence of delicate webbing.",
    cause: "Caused by tiny arachnids feeding on leaf sap; populations explode in hot, dry, and dusty conditions.",
    productUrl: "https://www.amazon.com/s?k=Neem+oil+for+plants"
  },
  "Target Spot": {
    product: "Azoxystrobin or Chlorothalonil",
    treatment: "Remove infected leaves and apply fungicide according to label instructions. Maintain proper spacing between plants for airflow.",
    explanation: "Noticed small brown spots with faint concentric circles that resemble a target or bullseye.",
    cause: "Caused by the fungus Corynespora cassiicola, favoring warm temperatures and alternating dry/wet periods.",
    productUrl: "https://www.amazon.com/s?k=Azoxystrobin+fungicide"
  },
  "Yellow Leaf Curl Virus": {
    product: "Imidacloprid (for whitefly control)",
    treatment: "Remove severely infected plants. Control whiteflies using insecticide or yellow sticky traps to prevent further spread.",
    explanation: "Analyzed severe upward curling, crumpling, and yellowing of leaf margins near the stem.",
    cause: "Caused by a virus transmitted exclusively by silverleaf whiteflies as they feed on the plant sap.",
    productUrl: "https://www.amazon.com/s?k=Imidacloprid+insecticide"
  },
  "Mosaic Virus": {
    product: "No chemical cure",
    treatment: "Remove infected plants immediately. Disinfect gardening tools and control aphids to prevent the virus from spreading to healthy plants.",
    explanation: "Observed mottled 'mosaic' patterns of light and dark green on distorted or stunted leaves.",
    cause: "Caused by various viruses often introduced by sap-sucking insects like aphids or contaminated tools.",
    productUrl: "https://www.amazon.com/s?k=Aphid+control+organic"
  },
  "Healthy": {
    product: "General purpose organic fertilizer",
    treatment: "Continue regular watering, provide sufficient sunlight, and apply organic fertilizer every 2-3 weeks to maintain healthy growth.",
    explanation: "Leaf shows consistent chlorophyll distribution, strong vascular structure, and no signs of bacterial or fungal pathogens.",
    cause: "The plant is receiving optimal sunlight, water, and nutrients, effectively resisting environmental stressors.",
    productUrl: "https://www.amazon.com/s?k=Organic+tomato+fertilizer"
  },
  "Not a Tomato Leaf": {
    product: "N/A",
    treatment: "Please upload an image of a tomato plant leaf for accurate disease detection.",
    explanation: "The uploaded image does not appear to be a tomato plant leaf. This system is specifically trained for tomato crop diagnostics.",
    cause: "Non-target plant species detected.",
    productUrl: "#"
  }
};
