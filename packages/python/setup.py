from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="glin-sdk",
    version="0.1.0",
    author="GLIN AI",
    author_email="dev@glin.ai",
    description="Official Python SDK for GLIN AI Training Network",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/glin-ai/glin-sdk",
    project_urls={
        "Bug Tracker": "https://github.com/glin-ai/glin-sdk/issues",
        "Documentation": "https://docs.glin.ai/sdk/python",
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "substrate-interface>=1.7.0",
        "scalecodec>=1.2.0",
        "requests>=2.31.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.7.0",
            "mypy>=1.5.0",
        ],
    },
)
