
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export const NICHES = [
  { value: "General Online Business", label: "General Online Business - DS, SMMA, trading, sales, all online business" },
  { value: "Info Products", label: "Info Products - coaching, consulting, digital product owners, digital marketing..." },
  { value: "Startups & Tech", label: "Startups & Tech - app founders, SaaS, innovation-driven business accounts..." },
  { value: "Fitness", label: "Fitness - gym, calisthenics, sports, performance, yoga, pilates..." },
  { value: "Mindset", label: "Mindset - inspiration, esoteric, manifestation, mindset reprogramming..." },
  { value: "Health & Wellness", label: "Health & Wellness - nutrition, longevity, biohacking..." },
  { value: "Lifestyle & Personal Brand", label: "Lifestyle & Personal Brand - travel, luxury, day-in-the-life, content-first creators..." }
];

const BUSINESS_TYPES = [
  { value: "personal_brand", label: "Personal Brand" },
  { value: "b2c", label: "Business-to-Consumer (B2C)" }
];

const FormField = ({ id, label, required, children }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

export default function ProfileForm({ profile, isLoading, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "b2c",
    niche: "",
    offer_statement: "",
    content_interests: "",
    target_audience: "",
    audience_pains: "",
    business_story: "",
    desired_outcome: "",
    customer_objections: "",
    offer_structure: "",
    usp: "",
    client_results: "",
    client_count: "",
    existing_content_scripts: "",
  });

  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile) {
      // Edit existing profile - load its data
      setFormData({
        business_name: profile.business_name || "",
        business_type: profile.business_type || "b2c",
        niche: profile.niche || "",
        offer_statement: profile.offer_statement || "",
        content_interests: profile.content_interests || "",
        target_audience: profile.target_audience || "",
        audience_pains: profile.audience_pains || "",
        business_story: profile.business_story || "",
        desired_outcome: profile.desired_outcome || "",
        customer_objections: profile.customer_objections || "",
        offer_structure: profile.offer_structure || "",
        usp: profile.usp || "",
        client_results: profile.client_results || "",
        client_count: profile.client_count || "",
        existing_content_scripts: profile.existing_content_scripts || "",
      });
      // Assuming uploadedFiles are not persisted or are derived from existing_content_scripts
      // For simplicity, we won't re-populate uploadedFiles from profile.existing_content_scripts
      // as it would require parsing and reverse-engineering the appended text.
      setUploadedFiles([]); // Clear any files that might have been uploaded for a previous new profile attempt
    } else {
      // New profile - reset to empty form
      setFormData({
        business_name: "",
        business_type: "b2c",
        niche: "",
        offer_statement: "",
        content_interests: "",
        target_audience: "",
        audience_pains: "",
        business_story: "",
        desired_outcome: "",
        customer_objections: "",
        offer_structure: "",
        usp: "",
        client_results: "",
        client_count: "",
        existing_content_scripts: "",
      });
      setUploadedFiles([]); // Clear any uploaded files
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check all required fields EXCEPT existing_content_scripts
    const requiredFields = [
      'business_name',
      'niche',
      'offer_statement',
      'content_interests',
      'target_audience',
      'audience_pains',
      'business_story',
      'desired_outcome',
      'customer_objections',
      'offer_structure',
      'usp',
      'client_results',
      'client_count'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      for (const file of files) {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        let extractedText = '';
        
        // Handle TXT files directly by fetching content
        if (file.name.toLowerCase().endsWith('.txt')) {
          try {
            const response = await fetch(file_url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            extractedText = await response.text();
          } catch (fetchError) {
            console.error("Error reading txt file:", fetchError);
            alert(`Error reading ${file.name}. Please try again.`);
            continue; // Skip to next file
          }
        } else {
          // For PDF, DOCX, CSV - use extraction integration
          try {
            const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
              file_url,
              json_schema: {
                type: "object",
                properties: {
                  content: { type: "string" }
                }
              }
            });

            if (extractionResult.status === "success" && extractionResult.output) {
              extractedText = extractionResult.output.content || JSON.stringify(extractionResult.output);
            } else {
              console.error("Extraction failed:", extractionResult);
              alert(`Error processing ${file.name}. Please try again.`);
              continue; // Skip to next file
            }
          } catch (extractError) {
            console.error("Error extracting file:", extractError);
            alert(`Error processing ${file.name}. Please try again.`);
            continue; // Skip to next file
          }
        }

        if (extractedText) { // Only proceed if text was successfully extracted/read
          setUploadedFiles(prev => [...prev, { name: file.name, content: extractedText, url: file_url }]);
          
          // Append to existing_content_scripts
          const currentScripts = formData.existing_content_scripts || '';
          const separator = currentScripts.trim() ? '\n\n---\n\n' : '';
          handleChange('existing_content_scripts', `${currentScripts}${separator}[From ${file.name}]\n${extractedText}`);
        }
      }
    } catch (error) { // This catch block handles errors during base44.integrations.Core.UploadFile or general unexpected errors
      console.error("Error processing files (general catch):", error);
      alert("Error processing files. Please try again.");
    }
    setIsProcessing(false);
    
    // Reset file input
    e.target.value = '';
  };

  const removeUploadedFile = (indexToRemove) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        // Attempt to remove the text corresponding to this file from existing_content_scripts
        const currentScripts = formData.existing_content_scripts || '';
        const fileContentMarker = `[From ${fileToRemove.name}]\n${fileToRemove.content}`;
        
        let newScripts = currentScripts.replace(fileContentMarker, '').trim();
        // Clean up any double separators or leading/trailing separators
        newScripts = newScripts.replace(/(\n\n---\n\n)+/g, '\n\n---\n\n').trim();
        if (newScripts.startsWith('---')) {
          newScripts = newScripts.substring(newScripts.indexOf('\n') + 1).trim();
        }
        if (newScripts.endsWith('---')) {
          newScripts = newScripts.substring(0, newScripts.lastIndexOf('\n') - 2).trim();
        }
        
        handleChange('existing_content_scripts', newScripts);
      }
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-300');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (isLoading) {
    return <div className="animate-pulse p-4 text-slate-600">Loading profile details...</div>;
  }

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Please fill out all required fields</h4>
            <p className="text-sm text-red-700">All fields marked with * are mandatory to create your profile.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <FormField id="business_name" label="What is your business name?" required>
          <Input 
            id="business_name" 
            value={formData.business_name} 
            onChange={(e) => handleChange('business_name', e.target.value)} 
            required
            className={errors.business_name ? 'border-red-300' : ''}
          />
          {errors.business_name && <p className="text-xs text-red-600 mt-1">{errors.business_name}</p>}
        </FormField>
        <FormField id="business_type" label="What type of business are you?" required>
          <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      
      <FormField id="niche" label="What's your niche?" required>
        <Select value={formData.niche} onValueChange={(v) => handleChange('niche', v)} required>
          <SelectTrigger className={errors.niche ? 'border-red-300' : ''}><SelectValue placeholder="Select a niche" /></SelectTrigger>
          <SelectContent>
            {NICHES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.niche && <p className="text-xs text-red-600 mt-1">{errors.niche}</p>}
      </FormField>

      <FormField id="offer_statement" label="Offer statement" required>
        <Textarea 
          id="offer_statement" 
          value={formData.offer_statement} 
          onChange={(e) => handleChange('offer_statement', e.target.value)} 
          placeholder="e.g., I help busy professionals lose 20 pounds in 90 days without giving up their favorite foods."
          className={errors.offer_statement ? 'border-red-300' : ''}
        />
        {errors.offer_statement && <p className="text-xs text-red-600 mt-1">{errors.offer_statement}</p>}
      </FormField>

      <FormField id="content_interests" label="What are your interests you would want in your content?" required>
        <Input 
          id="content_interests" 
          value={formData.content_interests} 
          onChange={(e) => handleChange('content_interests', e.target.value)} 
          placeholder="e.g., Stoicism, biohacking, marketing trends"
          className={errors.content_interests ? 'border-red-300' : ''}
        />
        {errors.content_interests && <p className="text-xs text-red-600 mt-1">{errors.content_interests}</p>}
      </FormField>

      <FormField id="target_audience" label="Who is your target audience?" required>
        <Textarea 
          id="target_audience" 
          value={formData.target_audience} 
          onChange={(e) => handleChange('target_audience', e.target.value)} 
          placeholder="Describe their demographics, lifestyle, and values."
          className={errors.target_audience ? 'border-red-300' : ''}
        />
        {errors.target_audience && <p className="text-xs text-red-600 mt-1">{errors.target_audience}</p>}
      </FormField>
      
      <FormField id="audience_pains" label="What are the biggest pains or problems they have that your business solves?" required>
        <Textarea 
          id="audience_pains" 
          value={formData.audience_pains} 
          onChange={(e) => handleChange('audience_pains', e.target.value)}
          className={errors.audience_pains ? 'border-red-300' : ''}
        />
        {errors.audience_pains && <p className="text-xs text-red-600 mt-1">{errors.audience_pains}</p>}
      </FormField>

      <FormField id="business_story" label="What's your or your business's story, experiences, struggles?" required>
        <Textarea 
          id="business_story" 
          value={formData.business_story} 
          onChange={(e) => handleChange('business_story', e.target.value)}
          className={errors.business_story ? 'border-red-300' : ''}
        />
        {errors.business_story && <p className="text-xs text-red-600 mt-1">{errors.business_story}</p>}
      </FormField>

      <FormField id="desired_outcome" label="What results or desired outcome do they want from you?" required>
        <Textarea 
          id="desired_outcome" 
          value={formData.desired_outcome} 
          onChange={(e) => handleChange('desired_outcome', e.target.value)}
          className={errors.desired_outcome ? 'border-red-300' : ''}
        />
        {errors.desired_outcome && <p className="text-xs text-red-600 mt-1">{errors.desired_outcome}</p>}
      </FormField>

      <FormField id="customer_objections" label="What objections do customers often have before buying?" required>
        <Textarea 
          id="customer_objections" 
          value={formData.customer_objections} 
          onChange={(e) => handleChange('customer_objections', e.target.value)} 
          placeholder="e.g., It's too expensive, I don't have time, Will this work for me?"
          className={errors.customer_objections ? 'border-red-300' : ''}
        />
        {errors.customer_objections && <p className="text-xs text-red-600 mt-1">{errors.customer_objections}</p>}
      </FormField>

      <FormField id="offer_structure" label="What is your offer/service/product structure?" required>
        <Textarea 
          id="offer_structure" 
          value={formData.offer_structure} 
          onChange={(e) => handleChange('offer_structure', e.target.value)} 
          placeholder="e.g., 12-week online course with video modules, weekly coaching calls, and a private community."
          className={errors.offer_structure ? 'border-red-300' : ''}
        />
        {errors.offer_structure && <p className="text-xs text-red-600 mt-1">{errors.offer_structure}</p>}
      </FormField>

      <FormField id="usp" label="What is your unique selling proposition?" required>
        <Textarea 
          id="usp" 
          value={formData.usp} 
          onChange={(e) => handleChange('usp', e.target.value)} 
          placeholder="What makes you different from competitors?"
          className={errors.usp ? 'border-red-300' : ''}
        />
        {errors.usp && <p className="text-xs text-red-600 mt-1">{errors.usp}</p>}
      </FormField>
      
      <FormField id="client_results" label="What are your client results?" required>
        <Textarea 
          id="client_results" 
          value={formData.client_results} 
          onChange={(e) => handleChange('client_results', e.target.value)} 
          placeholder="Describe as many as you want. e.g., 'John went from 0 to $10k/month', 'Sarah lost 30 pounds'."
          className={errors.client_results ? 'border-red-300' : ''}
        />
        {errors.client_results && <p className="text-xs text-red-600 mt-1">{errors.client_results}</p>}
      </FormField>
      
      <FormField id="client_count" label="How many clients/customers have you served so far?" required>
        <Input 
          id="client_count" 
          value={formData.client_count} 
          onChange={(e) => handleChange('client_count', e.target.value)}
          className={errors.client_count ? 'border-red-300' : ''}
        />
        {errors.client_count && <p className="text-xs text-red-600 mt-1">{errors.client_count}</p>}
      </FormField>

      <FormField id="existing_content_scripts" label="Upload scripts of your existing content (Optional)">
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Click to upload documents</p>
                <p className="text-xs text-slate-500">PDF, DOCX, TXT supported</p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              Processing content...
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Content:</Label>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadedFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Manual Textarea */}
          <Textarea 
            id="existing_content_scripts" 
            value={formData.existing_content_scripts} 
            onChange={(e) => handleChange('existing_content_scripts', e.target.value)} 
            rows={6} 
            placeholder="Or manually paste your content here, or describe your tone (e.g., witty and informal, professional and authoritative)."
            className={errors.existing_content_scripts ? 'border-red-300' : ''}
          />
          {errors.existing_content_scripts && <p className="text-xs text-red-600 mt-1">{errors.existing_content_scripts}</p>}
          <p className="text-xs text-slate-500">Optional: Upload documents or manually describe your writing style to help AI match your voice.</p>
        </div>
      </FormField>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={isSaving || isProcessing}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 shadow-lg shadow-purple-300/40"
        >
          {isSaving || isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {isProcessing ? 'Processing...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {profile ? "Update Profile" : "Create Profile"}
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
