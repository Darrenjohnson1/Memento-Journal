import { InferenceClient } from "@huggingface/inference";

const HfInference = new InferenceClient(process.env.HUGGING_FACE_KEY);

export default HfInference;
