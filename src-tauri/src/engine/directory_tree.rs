use serde::{Deserialize, Serialize};
use super::file_classifier::FileCategory;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreeNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub file_count: usize,
    pub is_dir: bool,
    pub category: FileCategory,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub children: Vec<TreeNode>,
}

impl TreeNode {
    pub fn new(id: String, name: String, path: String, is_dir: bool, category: FileCategory) -> Self {
        Self {
            id,
            name,
            path,
            size_bytes: 0,
            file_count: if is_dir { 0 } else { 1 },
            is_dir,
            category,
            children: Vec::new(),
        }
    }

    /// Sorts children recursively by size descending
    pub fn sort_by_size(&mut self) {
        self.children.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        for child in &mut self.children {
            child.sort_by_size();
        }
    }

    /// Prunes small nodes below a threshold percentage of parent size to limit payload size
    pub fn prune_for_visualization(&self, max_depth: usize, min_size_bytes: u64) -> TreeNode {
        let mut cloned = TreeNode {
            id: self.id.clone(),
            name: self.name.clone(),
            path: self.path.clone(),
            size_bytes: self.size_bytes,
            file_count: self.file_count,
            is_dir: self.is_dir,
            category: self.category,
            children: Vec::new(),
        };

        if max_depth == 0 {
            return cloned;
        }

        let mut other_size = 0u64;
        let mut other_count = 0usize;

        for child in &self.children {
            if child.size_bytes >= min_size_bytes {
                cloned.children.push(child.prune_for_visualization(max_depth - 1, min_size_bytes));
            } else {
                other_size += child.size_bytes;
                other_count += child.file_count;
            }
        }

        if other_size > 0 {
            cloned.children.push(TreeNode {
                id: format!("{}/__other__", self.id),
                name: format!("Other items ({})", other_count),
                path: self.path.clone(),
                size_bytes: other_size,
                file_count: other_count,
                is_dir: true,
                category: FileCategory::Other,
                children: Vec::new(),
            });
        }

        cloned
    }
}

