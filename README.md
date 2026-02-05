# NAFLD Notebook Setup

This workspace contains the NAFLD analysis notebook and the dataset CSV used by the notebook.

## Prerequisites

- Python 3.10 or newer
- Optional: Conda (for the environment.yml path)

## Setup (pip)

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Launch the notebook:

```bash
jupyter notebook NAFLD.ipynb
```

## Setup (conda)

1. Create the environment:

```bash
conda env create -f environment.yml
```

2. Activate it:

```bash
conda activate nafld
```

3. Launch the notebook:

```bash
jupyter notebook NAFLD.ipynb
```

## Files

- NAFLD.ipynb: Main analysis notebook
- Data+set+Int+J+Obesity.csv: Input dataset used by the notebook
- requirements.txt / environment.yml: Python dependencies
