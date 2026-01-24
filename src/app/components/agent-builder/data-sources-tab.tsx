import { useState } from 'react';
import { FileText, Globe, MessageSquare, Upload, Plus, Trash2, Edit, Book } from 'lucide-react';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface DataSource {
  id: string;
  type: 'file' | 'website' | 'text' | 'qa';
  name: string;
  characters: number;
  addedDate: string;
}

export function DataSourcesTab() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      type: 'file',
      name: 'Product FAQ.pdf',
      characters: 400000,
      addedDate: '2 days ago',
    },
    {
      id: '2',
      type: 'website',
      name: 'https://company.com',
      characters: 250000,
      addedDate: '5 days ago',
    },
    {
      id: '3',
      type: 'qa',
      name: 'Custom Q&A (25 pairs)',
      characters: 50000,
      addedDate: '1 week ago',
    },
  ]);

  const totalCharacters = dataSources.reduce((sum, source) => sum + source.characters, 0);
  const maxCharacters = 11000000;
  const usagePercentage = (totalCharacters / maxCharacters) * 100;

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return FileText;
      case 'website':
        return Globe;
      case 'text':
        return MessageSquare;
      case 'qa':
        return Book;
      default:
        return FileText;
    }
  };

  const deleteSource = (id: string) => {
    setDataSources(dataSources.filter((source) => source.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Data Sources</h2>
            <p className="text-text-secondary">
              Train your agent on your knowledge base
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <GradientButton className="gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </GradientButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Data Source</DialogTitle>
              </DialogHeader>
              
              <div className="py-6">
                <p className="text-text-secondary mb-6">Choose source type:</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button className="p-6 rounded-xl border border-border hover:border-border-emphasis hover:bg-secondary transition-all text-center">
                    <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="font-medium">Files</div>
                    <div className="text-xs text-text-muted mt-1">PDF, DOC, TXT</div>
                  </button>
                  
                  <button className="p-6 rounded-xl border border-border hover:border-border-emphasis hover:bg-secondary transition-all text-center">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="font-medium">Website</div>
                    <div className="text-xs text-text-muted mt-1">Scrape URLs</div>
                  </button>
                  
                  <button className="p-6 rounded-xl border border-border hover:border-border-emphasis hover:bg-secondary transition-all text-center">
                    <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="font-medium">Text</div>
                    <div className="text-xs text-text-muted mt-1">Paste content</div>
                  </button>
                  
                  <button className="p-6 rounded-xl border border-border hover:border-border-emphasis hover:bg-secondary transition-all text-center">
                    <Book className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="font-medium">Q&A</div>
                    <div className="text-xs text-text-muted mt-1">Question pairs</div>
                  </button>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-border-emphasis hover:bg-secondary/50 transition-all cursor-pointer">
                  <Upload className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-text-muted">
                    Supported: PDF, DOC, DOCX, TXT • Max file size: 10MB
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3 mb-6">
          <Button variant="outline" className="bg-transparent">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Globe className="h-4 w-4 mr-2" />
            Add Website
          </Button>
          <Button variant="outline" className="bg-transparent">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Text
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Book className="h-4 w-4 mr-2" />
            Add Q&A
          </Button>
        </div>
      </div>

      {/* Data sources list */}
      <div className="space-y-3 mb-8">
        {dataSources.map((source) => {
          const Icon = getIcon(source.type);
          return (
            <div
              key={source.id}
              className="bg-card rounded-xl p-4 border border-border hover:border-border-emphasis transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{source.name}</div>
                    <div className="text-sm text-text-muted">
                      {source.characters.toLocaleString()} characters • Added {source.addedDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSource(source.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage stats */}
      <div className="bg-card rounded-xl p-6 border border-border mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold mb-1">Total Characters</div>
            <div className="text-sm text-text-secondary">
              {totalCharacters.toLocaleString()} / {maxCharacters.toLocaleString()}
            </div>
          </div>
          <div className="text-2xl font-bold">{usagePercentage.toFixed(0)}%</div>
        </div>
        <Progress value={usagePercentage} className="mb-3" />
        <div className="text-xs text-text-muted">
          {(maxCharacters - totalCharacters).toLocaleString()} characters remaining
        </div>
      </div>

      {/* Training status */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">Training Status</div>
            <div className="text-sm text-text-secondary">Last trained: 2 hours ago</div>
          </div>
          <GradientButton>Retrain Now</GradientButton>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border">
          <div className="font-medium mb-3">Suggestions (2 new)</div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5" />
              <div>
                <span className="text-text-secondary">Add information about </span>
                <span className="text-foreground font-medium">refund policy</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5" />
              <div>
                <span className="text-text-secondary">Update </span>
                <span className="text-foreground font-medium">pricing details</span>
                <span className="text-text-secondary"> (detected conflict)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
